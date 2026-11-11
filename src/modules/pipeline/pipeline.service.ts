// 2. 프로듀서 (파일 업로드 직후 큐에 작업 던지기)
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { JobStatus } from 'generated/prisma/enums';
import { MeetingProgressService } from 'src/modules/meetings/features/meeting-progress.service';
import { PREPROCESS_STEP } from 'src/modules/meetings/features/meeting-progress.types';
import { FfmpegService } from 'src/modules/pipeline/ffmpeg.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import {
  SERVER_PREPROCESSED_SOURCE,
  StorageService,
} from 'src/modules/R2/r2.service';

@Injectable()
export class AiPipelineService {
  constructor(
    @InjectQueue('meeting-ai-pipeline') private aiQueue: Queue,
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
    private readonly ffmpegService: FfmpegService,
    private readonly meetingProgressService: MeetingProgressService,
  ) {}

  async enqueueMediaPreprocess(
    fileKey: string,
    meetingRecordId: string,
  ): Promise<void> {
    await this.aiQueue.add(
      'preprocess-media',
      {
        meetingRecordId,
        fileKey,
      },
      {
        deduplication: { id: `preprocess-media:${meetingRecordId}` },
        removeOnComplete: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
  }

  async processUploadedMedia(
    fileKey: string,
    meetingRecordId: string,
  ): Promise<{ audioKey: string; duration: number }> {
    const { outputPath: audioPath, duration } =
      await this.ffmpegService.resetTimestamps(
        fileKey,
        async (phase, ratio) => {
          if (phase === 'download') {
            await this.meetingProgressService.setProgress(
              meetingRecordId,
              22,
              'preprocess',
              undefined,
              PREPROCESS_STEP.download,
            );
            return;
          }
          if (phase === 'probe') {
            await this.meetingProgressService.setProgress(
              meetingRecordId,
              26,
              'preprocess',
              undefined,
              PREPROCESS_STEP.probe,
            );
            return;
          }
          // convert: 28% ~ 36%
          const percent = 28 + Math.round((ratio ?? 0) * 8);
          await this.meetingProgressService.setProgress(
            meetingRecordId,
            percent,
            'preprocess',
            undefined,
            PREPROCESS_STEP.convert,
          );
        },
      );

    try {
      await this.meetingProgressService.setProgress(
        meetingRecordId,
        38,
        'preprocess',
        undefined,
        PREPROCESS_STEP.upload,
      );

      const audioKey = this.toAudioKey(fileKey);
      await this.storageService.uploadFile(audioKey, audioPath, 'audio/wav', {
        source: SERVER_PREPROCESSED_SOURCE,
      });
      return { audioKey, duration };
    } finally {
      await this.ffmpegService.cleanup(audioPath);
    }
  }

  async startProcessing(fileKey: string) {
    const row = await this.prismaService.meetingRecord.findFirst({
      where: { file_url: fileKey },
    });
    if (!row) {
      throw new NotFoundException('Meeting record not found');
    }

    await this.meetingProgressService.setProgress(
      row.id,
      50,
      'processing',
      JobStatus.PROCESSING,
    );

    await this.aiQueue.add(
      'process-audio',
      {
        meetingRecordId: row.id,
        fileKey,
      },
      {
        removeOnComplete: true,
        attempts: 3, // 딥그램이나 LLM API 네트워크 뻗었을 때 재시도
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
  }

  private toAudioKey(fileKey: string): string {
    const withoutExt = fileKey.replace(/\.[^/.]+$/, '');
    return `${withoutExt.replace('/uploads/', '/audio/')}.wav`;
  }
}
