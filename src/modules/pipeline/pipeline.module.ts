import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MeetingProgressModule } from 'src/modules/meetings/features/meeting-progress.module';
import { MeetingsDataModule } from 'src/modules/meetings/features/meetings-data.module';
import { DeepgramService } from 'src/modules/pipeline/deepgram.service';
import { FfmpegService } from 'src/modules/pipeline/ffmpeg.service';
import { LlmService } from 'src/modules/pipeline/openai.service';
import { AiPipelineService } from 'src/modules/pipeline/pipeline.service';
import { AiPipelineProcessor } from 'src/modules/pipeline/pipeline.worker';
import { PrismaModule } from 'src/modules/prisma/prisma.module';
import { R2Module } from 'src/modules/R2/r2.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: { host: 'localhost', port: 6379 },
    }),
    BullModule.registerQueue({
      name: 'meeting-ai-pipeline',
    }),
    MeetingsDataModule,
    MeetingProgressModule,
    PrismaModule,
    R2Module,
    ConfigModule,
  ],
  providers: [
    AiPipelineService,
    AiPipelineProcessor,
    DeepgramService,
    FfmpegService,
    LlmService,
  ],
  exports: [AiPipelineService],
})
export class AiPipelineModule {}
