import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { JobStatus } from 'generated/prisma/enums';
import { MeetingProgressGateway } from 'src/modules/meetings/features/meeting-progress.gateway';
import {
  MEETING_PROGRESS_EVENT,
  MeetingProgressPayload,
  MeetingProgressStage,
  stageFromPercent,
  toProgressPayload,
} from 'src/modules/meetings/features/meeting-progress.types';
import { MeetingsRepository } from 'src/modules/meetings/features/meetings.repository';

@Injectable()
export class MeetingProgressService {
  constructor(
    private readonly meetingsRepository: MeetingsRepository,
    @Inject(forwardRef(() => MeetingProgressGateway))
    private readonly meetingProgressGateway: MeetingProgressGateway,
  ) {}

  async getActiveProgress(
    userId: string,
  ): Promise<MeetingProgressPayload | null> {
    const meeting =
      await this.meetingsRepository.findInProgressByUserId(userId);
    if (!meeting) {
      return null;
    }

    const stage = stageFromPercent(meeting.progress_percent, meeting.status);
    return toProgressPayload(
      meeting.title ?? '',
      meeting.progress_percent,
      stage,
    );
  }

  async setProgress(
    meetingId: string,
    percent: number,
    stage: MeetingProgressStage,
    status?: JobStatus,
    stepOverride?: string,
  ): Promise<MeetingProgressPayload> {
    const meeting = await this.meetingsRepository.updateProgress(
      meetingId,
      percent,
      status,
    );

    const resolvedStage: MeetingProgressStage =
      status === JobStatus.FAILED_UNPROCESSABLE ||
      status === JobStatus.REJECTED_VIOLATION
        ? 'failed'
        : stage;

    // LLM 확정 전: createRecord 때 넣은 파일명 유지 / 완료 후: DB title(LLM) 사용
    const payload = toProgressPayload(
      meeting.title ?? '',
      meeting.progress_percent,
      resolvedStage,
      stepOverride,
    );

    this.meetingProgressGateway.emitToUser(
      meeting.user_id,
      MEETING_PROGRESS_EVENT,
      payload,
    );

    return payload;
  }
}
