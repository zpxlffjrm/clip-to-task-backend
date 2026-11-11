import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

export const S3_CLIENT = 'S3_CLIENT';

export const S3ClientProvider: Provider = {
  provide: S3_CLIENT,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    // const accountId = configService.get<string>('R2_ACCOUNT_ID');

    return new S3Client({
      region: 'auto', // Cloudflare R2는 region을 'auto'로 설정
      endpoint: configService.get<string>('R2_ENDPOINT'),
      forcePathStyle: true,

      credentials: {
        accessKeyId: configService.get<string>('R2_ACCESS_KEY_ID') as string,
        secretAccessKey: configService.get<string>(
          'R2_SECRET_ACCESS_KEY',
        ) as string,
      },
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  },
};
