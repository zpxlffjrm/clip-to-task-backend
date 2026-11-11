import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { JobStatus } from 'generated/prisma/enums';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MeetingProgressService } from 'src/modules/meetings/features/meeting-progress.service';
import { AUDIO_STEP } from 'src/modules/meetings/features/meeting-progress.types';
import { MeetingsRepository } from 'src/modules/meetings/features/meetings.repository';
import { DeepgramService } from 'src/modules/pipeline/deepgram.service';
import { LlmService } from 'src/modules/pipeline/openai.service';
import { AiPipelineService } from 'src/modules/pipeline/pipeline.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { StorageService } from 'src/modules/R2/r2.service';

interface MeetingJobData {
  meetingRecordId: string;
  fileKey: string;
}

@Processor('meeting-ai-pipeline', {
  lockDuration: 30 * 60 * 1000,
})
export class AiPipelineProcessor extends WorkerHost {
  constructor(
    private readonly deepgramService: DeepgramService,
    private readonly llmService: LlmService,
    private readonly mongoRepo: MeetingsRepository,
    private readonly pipelineService: AiPipelineService,
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
    private readonly meetingProgressService: MeetingProgressService,
  ) {
    super();
  }

  async process(job: Job<MeetingJobData>): Promise<void> {
    if (job.name === 'preprocess-media') {
      await this.preprocessMedia(job.data);
      return;
    }

    await this.processAudio(job.data);
  }

  private async preprocessMedia({
    meetingRecordId,
    fileKey,
  }: MeetingJobData): Promise<void> {
    try {
      await this.meetingProgressService.setProgress(
        meetingRecordId,
        20,
        'preprocess',
      );

      const { audioKey, duration } =
        await this.pipelineService.processUploadedMedia(
          fileKey,
          meetingRecordId,
        );
      await this.mongoRepo.updateFileUrl(meetingRecordId, audioKey);

      await this.prismaService.meetingRecord.update({
        where: { id: meetingRecordId },
        data: {
          duration_sec: duration,
        },
      });

      await this.meetingProgressService.setProgress(
        meetingRecordId,
        40,
        'preprocessed',
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const current = await this.prismaService.meetingRecord.findUnique({
        where: { id: meetingRecordId },
        select: { progress_percent: true },
      });

      await this.prismaService.meetingRecord.update({
        where: { id: meetingRecordId },
        data: {
          status: JobStatus.FAILED_UNPROCESSABLE,
          error_message: errorMessage,
        },
      });

      await this.meetingProgressService.setProgress(
        meetingRecordId,
        current?.progress_percent ?? 20,
        'failed',
        JobStatus.FAILED_UNPROCESSABLE,
      );

      console.error(error);
      throw error;
    }
  }

  private async processAudio({
    meetingRecordId,
    fileKey,
  }: MeetingJobData): Promise<void> {
    console.log('fileKey', fileKey);

    const workDir = await mkdtemp(join(tmpdir(), 'cliptotask-'));
    const audioFilePath = join(workDir, 'audio.wav');

    try {
      await this.meetingProgressService.setProgress(
        meetingRecordId,
        55,
        'processing',
        undefined,
        AUDIO_STEP.download,
      );
      await this.storageService.downloadToFile(fileKey, audioFilePath);

      await this.meetingProgressService.setProgress(
        meetingRecordId,
        65,
        'stt',
        undefined,
        AUDIO_STEP.stt,
      );
      const sttResult = await this.deepgramService.callDeepgram(audioFilePath);

      await this.meetingProgressService.setProgress(
        meetingRecordId,
        78,
        'llm',
        undefined,
        AUDIO_STEP.llm,
      );
      const llmResult = await this.llmService.callLLM(
        sttResult.text,
        sttResult.speakers,
      );

      await this.meetingProgressService.setProgress(
        meetingRecordId,
        90,
        'llm',
        undefined,
        AUDIO_STEP.llm,
      );

      await this.meetingProgressService.setProgress(
        meetingRecordId,
        95,
        'llm',
        undefined,
        AUDIO_STEP.save,
      );

      // 4. 몽고DB에 분석 결과 전체 JSON 저장
      const record = await this.mongoRepo.updateMeetingRecord(meetingRecordId, {
        speakerMapping: {},
        timeline: sttResult.timeline,
        summary: llmResult.summary,
        title: llmResult.title,
        actionItems: llmResult.actionItems,
      });

      // 5. Postgres 상태·확정 타이틀 업데이트 후 100% emit
      const updatedRecord = await this.prismaService.meetingRecord.update({
        where: { id: meetingRecordId },
        data: {
          status: JobStatus.COMPLETED,
          title: llmResult.title,
          mongo_result_id: record?._id.toString() || null,
        },
      });

      await this.prismaService.actionItem.createMany({
        data: llmResult.actionItems.map((actionItem) => ({
          user_id: updatedRecord.user_id,
          meeting_record_id: meetingRecordId,
          assignee: actionItem.assignee,
          task: actionItem.task,
          deadline: actionItem.deadline,
        })),
      });

      const participants =
        llmResult.participants.length > 0
          ? llmResult.participants
          : sttResult.speakers.map((speaker) => ({
              name: speaker,
              speakerLabel: speaker,
            }));

      if (participants.length > 0) {
        await this.prismaService.meetingParticipant.createMany({
          data: participants.map((participant) => ({
            meeting_record_id: meetingRecordId,
            name: participant.name,
            speaker_label: participant.speakerLabel,
          })),
        });
      }

      await this.meetingProgressService.setProgress(
        meetingRecordId,
        100,
        'completed',
        JobStatus.COMPLETED,
      );
    } catch (error) {
      // 6. error 타입이 unknown이므로 타입 가드를 통해 안전하게 메시지를 추출합니다.
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      const current = await this.prismaService.meetingRecord.findUnique({
        where: { id: meetingRecordId },
        select: { progress_percent: true },
      });

      // 에러 발생 시 Postgres 상태 업데이트 (FAILED_UNPROCESSABLE)
      await this.prismaService.meetingRecord.update({
        where: { id: meetingRecordId },
        data: {
          status: JobStatus.FAILED_UNPROCESSABLE,
          error_message: errorMessage,
        },
      });

      await this.meetingProgressService.setProgress(
        meetingRecordId,
        current?.progress_percent ?? 50,
        'failed',
        JobStatus.FAILED_UNPROCESSABLE,
      );

      console.error(error);
      throw error;
    } finally {
      await rm(workDir, { recursive: true, force: true });
    }
  }
}
