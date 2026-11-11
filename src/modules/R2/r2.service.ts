import { Inject, Injectable } from '@nestjs/common';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { createReadStream, createWriteStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { S3_CLIENT } from 'src/modules/R2/r2.provider';

export const SERVER_PREPROCESSED_SOURCE = 'server-preprocessed';

@Injectable()
export class StorageService {
  private readonly bucketName: string;

  constructor(
    @Inject(S3_CLIENT) private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.get<string>(
      'R2_BUCKET_NAME',
    ) as string;
  }

  /**
   * 클라이언트가 R2로 직접 업로드할 수 있는 Presigned URL 발급
   */
  async getUploadPresignedUrl(
    userId: string,
    fileName: string,
    fileType: string,
  ) {
    // 앞서 다룬 유저별/날짜별 Key 구조 적용
    const date = new Date().toISOString().slice(0, 7).replace('-', '/'); // YYYY/MM
    const fileKey = `users/${userId}/uploads/${date}/${Date.now()}_${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
      ContentType: fileType,
    });

    // 15분(900초) 동안 유효한 업로드 URL 생성
    const uploadUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn: 900,
    });

    return {
      uploadUrl,
      fileKey, // 이 fileKey를 DB에 저장해두고 사용
    };
  }

  /**
   * 외부 AI 서비스나 클라이언트가 읽을 수 있는 Presigned Download URL 발급
   */
  async getDownloadPresignedUrl(fileKey: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: fileKey,
    });

    // 1시간 유효한 다운로드 URL 발급
    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  async downloadToFile(fileKey: string, dest: string): Promise<void> {
    const result = await this.s3Client.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      }),
    );

    if (!result.Body) {
      throw new Error(`미디어 다운로드 실패: ${fileKey}`);
    }

    await pipeline(result.Body as Readable, createWriteStream(dest));
  }

  async uploadFile(
    fileKey: string,
    filePath: string,
    contentType: string,
    metadata?: Record<string, string>,
  ): Promise<void> {
    const { size } = await stat(filePath);

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: createReadStream(filePath),
        ContentType: contentType,
        ContentLength: size,
        Metadata: metadata,
      }),
    );
  }

  async isServerPreprocessed(fileKey: string): Promise<boolean> {
    const { Metadata } = await this.s3Client.send(
      new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      }),
    );

    return Metadata?.source === SERVER_PREPROCESSED_SOURCE;
  }
}
