import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus } from 'generated/prisma/enums';
import { CloudfrontWebHookReqDto } from 'src/modules/meetings/dtos/req/CloudfrontWebHoolReq.dto';
import { CreateRecordReqDto } from 'src/modules/meetings/dtos/req/CreateRecordReq.dto';
import { GetMeetingReqDto } from 'src/modules/meetings/dtos/req/GetMeetingReq.dto';
import { GetMeetingsReqDto } from 'src/modules/meetings/dtos/req/GetMeetingsReq.dto';
import { GetMeetingResDto } from 'src/modules/meetings/dtos/res/GetMeetingRes.dto';
import { GetMeetingsResDto } from 'src/modules/meetings/dtos/res/GetMeetingsRes.dto';
import { MeetingProgressService } from 'src/modules/meetings/features/meeting-progress.service';
import { MeetingsRepository } from 'src/modules/meetings/features/meetings.repository';
import { AiPipelineService } from 'src/modules/pipeline/pipeline.service';
import { StorageService } from 'src/modules/R2/r2.service';
import { UserService } from 'src/modules/users/feastures/user.service';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly meetingsRepository: MeetingsRepository,
    private readonly storageService: StorageService,
    private readonly pipelineService: AiPipelineService,
    private readonly userService: UserService,
    private readonly meetingProgressService: MeetingProgressService,
  ) {}

  async getMeetings(
    req: GetMeetingsReqDto,
    userId: string,
  ): Promise<GetMeetingsResDto[]> {
    const meetings = await this.meetingsRepository.getMeetings(req, userId);
    return meetings.map((meeting) => new GetMeetingsResDto(meeting));
  }

  async getMeeting(
    req: GetMeetingReqDto,
    userId: string,
  ): Promise<GetMeetingResDto> {
    const { meeting, meetingData } = await this.meetingsRepository.getMeeting(
      req.id,
      userId,
    );
    return new GetMeetingResDto({
      id: meeting.id,
      title: meeting.title ?? '',
      status: meeting.status,
      duration_sec: meeting.duration_sec ?? 0,
      created_at: meeting.created_at,
      actionItems: meetingData?.actionItems ?? [],
      summary: meetingData?.summary ?? [],
      timeline: meetingData?.timeline ?? [],
      speakerMapping: meetingData?.speakerMapping ?? {},
    });
  }

  // Presigned URL 발급 및 레코드 생성
  async createRecord(
    userUuid: string,
    dto: CreateRecordReqDto,
  ): Promise<{ uploadUrl: string; meetingId: string }> {
    const { fileName, fileType } = dto;
    const user = await this.userService.getUserByUuid(userUuid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const inProgress = await this.meetingsRepository.findInProgressByUserId(
      user.uuid,
    );
    if (inProgress) {
      throw new ConflictException(
        'A meeting is already being processed. Please wait until it finishes.',
      );
    }

    const { uploadUrl, fileKey } =
      await this.storageService.getUploadPresignedUrl(
        user.id,
        new Date().getTime().toString().concat(fileName),
        fileType,
      );

    const record = await this.meetingsRepository.createMeetingRecord({
      file_url: fileKey,
      status: JobStatus.PENDING,
      title: fileName,
      user_id: user.uuid,
      progress_percent: 0,
    });

    return { uploadUrl, meetingId: record.id };
  }

  private async queuePipeline(fileKey: string): Promise<void> {
    return await this.pipelineService.startProcessing(fileKey);
  }

  async cloudfrontUploadWebHook(dto: CloudfrontWebHookReqDto) {
    const fileKey = this.toFileKey(dto.key);
    if (await this.storageService.isServerPreprocessed(fileKey)) {
      return;
    }

    const record = await this.meetingsRepository.findByFileUrl(fileKey);
    if (!record) {
      throw new NotFoundException('Meeting record not found');
    }

    await this.meetingProgressService.setProgress(record.id, 10, 'uploaded');
    await this.pipelineService.enqueueMediaPreprocess(fileKey, record.id);
  }

  async cloudfrontAudioWebHook(dto: CloudfrontWebHookReqDto) {
    const fileKey = this.toFileKey(dto.key);
    if (!(await this.storageService.isServerPreprocessed(fileKey))) {
      return;
    }

    await this.queuePipeline(fileKey);
  }

  private toFileKey(urlOrKey: string): string {
    try {
      const parsed = new URL(urlOrKey);
      return decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    } catch {
      return urlOrKey.replace(/^\/+/, '');
    }
  }
}
