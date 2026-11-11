import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ActionItem, MeetingParticipant } from 'generated/prisma/browser';
import { MeetingRecord, Prisma } from 'generated/prisma/client';
import { JobStatus } from 'generated/prisma/enums';
import { Model, Types } from 'mongoose';
import { GetMeetingsReqDto } from 'src/modules/meetings/dtos/req/GetMeetingsReq.dto';
import {
  MeetingData,
  MeetingDataDocument,
  TimelineItem,
} from 'src/modules/meetings/schemas/meeting-data.schema';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class MeetingsRepository {
  constructor(
    @InjectModel(MeetingData.name)
    private meetingDataModel: Model<MeetingDataDocument>,
    private readonly prisma: PrismaService,
  ) {}

  async findByFileUrl(fileUrl: string): Promise<MeetingRecord | null> {
    return await this.prisma.meetingRecord.findFirst({
      where: { file_url: fileUrl },
    });
  }

  async findInProgressByUserId(userId: string): Promise<MeetingRecord | null> {
    return await this.prisma.meetingRecord.findFirst({
      where: {
        user_id: userId,
        status: {
          in: [JobStatus.PENDING, JobStatus.PROCESSING],
        },
      },
      orderBy: { created_at: 'asc' },
    });
  }

  async updateProgress(
    id: string,
    progressPercent: number,
    status?: JobStatus,
  ): Promise<MeetingRecord> {
    return await this.prisma.meetingRecord.update({
      where: { id },
      data: {
        progress_percent: progressPercent,
        ...(status ? { status } : {}),
      },
    });
  }

  async updateFileUrl(id: string, fileUrl: string): Promise<MeetingRecord> {
    return await this.prisma.meetingRecord.update({
      where: { id },
      data: { file_url: fileUrl },
    });
  }

  async createMeetingRecord(
    meetingRecord: Prisma.MeetingRecordUncheckedCreateInput,
  ): Promise<MeetingRecord> {
    console.log(meetingRecord);
    return await this.prisma.meetingRecord.create({
      data: {
        ...meetingRecord,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
  }

  async createMeetingDocument(
    meetingData: MeetingData,
  ): Promise<MeetingDataDocument> {
    return await this.meetingDataModel.create(meetingData);
  }

  async findMeetingDocByMeetingRecordId(
    meetingRecordId: string,
  ): Promise<MeetingDataDocument | null> {
    return await this.meetingDataModel.findOne({ meetingRecordId });
  }

  async updateMeetingRecord(
    meetingRecordId: string,
    data: Partial<Omit<MeetingData, 'meetingRecordId'>>,
  ): Promise<MeetingDataDocument | null> {
    return await this.meetingDataModel.findOneAndUpdate(
      { meetingRecordId },
      {
        $set: data,
        $setOnInsert: { meetingRecordId },
      },
      { returnDocument: 'after', upsert: true },
    );
  }

  // 유저가 Speaker_1을 김철수로 매핑할 때
  async updateSpeakerMapping(
    meetingRecordId: string,
    speakerMapping: Record<string, string>,
  ): Promise<MeetingDataDocument | null> {
    return await this.meetingDataModel.findOneAndUpdate(
      { meetingRecordId },
      { $set: { speakerMapping } },
      { new: true },
    );
  }

  // 액션 아이템 완료 상태 토글이나 내용을 수정할 때
  async updateActionItems(
    meetingRecordId: string,
    actionItems: any[], // 정의해둔 타입 사용
  ): Promise<MeetingDataDocument | null> {
    return await this.meetingDataModel.findOneAndUpdate(
      { meetingRecordId },
      { $set: { actionItems } },
      { new: true },
    );
  }

  // 회의록 삭제 시 Postgres 레코드와 함께 몽고DB 데이터 날릴 때
  async deleteMeetingData(meetingRecordId: string): Promise<void> {
    await this.meetingDataModel.deleteOne({ meetingRecordId });
  }

  async getMeetings(
    req: GetMeetingsReqDto,
    userId: string,
  ): Promise<
    Array<
      MeetingRecord & {
        action_items: ActionItem[];
        participants: MeetingParticipant[];
        summary: string[];
        timeline: TimelineItem[];
      }
    >
  > {
    const user = await this.prisma.user.findUnique({
      where: { uuid: userId },
    });

    if (!user) {
      console.log('User not found', userId);
      throw new NotFoundException('User not found');
    }

    const { page, limit } = req;
    const meetings = await this.prisma.meetingRecord.findMany({
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      where: {
        user_id: user.uuid,
      },
      include: {
        action_items: true,
        participants: true,
      },
    });

    // `/meetings` 목록은 Postgres(MeetingRecord) + Mongo(MeetingData)의
    // summary/timeline을 함께 프론트로 내려주기 위해 병합한다.
    const mongoIds = meetings
      .map((m) => m.mongo_result_id)
      .filter(
        (id): id is string =>
          typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id),
      );

    const meetingDataByMongoId = new Map<
      string,
      { summary: string[]; timeline: TimelineItem[] }
    >();

    if (mongoIds.length > 0) {
      const objectIds = mongoIds.map((id) => new Types.ObjectId(id));

      const meetingDatas = await this.meetingDataModel
        .find({ _id: { $in: objectIds } })
        .select('summary timeline');

      for (const doc of meetingDatas) {
        meetingDataByMongoId.set(doc._id.toString(), {
          summary: doc.summary ?? [],
          timeline: doc.timeline ?? [],
        });
      }
    }

    return meetings.map((meeting) => {
      const mongoId = meeting.mongo_result_id ?? '';
      const meetingData = mongoId
        ? meetingDataByMongoId.get(mongoId)
        : undefined;

      return {
        ...meeting,
        summary: meetingData?.summary ?? [],
        timeline: meetingData?.timeline ?? [],
      };
    });
  }

  async getMeeting(
    id: string,
    userId: string,
  ): Promise<{
    meeting: MeetingRecord;
    meetingData: MeetingDataDocument | null;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { uuid: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const meeting = await this.prisma.meetingRecord.findFirstOrThrow({
      where: { id },
    });

    const mongoId = new Types.ObjectId(meeting.mongo_result_id ?? '');

    const meetingData = await this.meetingDataModel.findOne({
      _id: mongoId,
    });

    return {
      meeting,
      meetingData: meetingData?.toObject() ?? null,
    };
  }
}
