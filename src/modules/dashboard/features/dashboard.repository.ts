import { Injectable, NotFoundException } from '@nestjs/common';
import { GetActionItemsReqDto } from 'src/modules/dashboard/dtos/req/GetActionItemsReq.dto';
import { GetRecentMeetingReqDto } from 'src/modules/dashboard/dtos/req/GetResentMeetingReq.dto';
import { GetActionItemsResDto } from 'src/modules/dashboard/dtos/res/GetActionItemsRes.dto';
import { GetRecentMeetingResDto } from 'src/modules/dashboard/dtos/res/GetRescentMeetingRes.dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class DashboardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getActionItems(dto: GetActionItemsReqDto) {
    const { userId, page, limit } = dto;

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const actionItems = await this.prisma.actionItem.findMany({
      where: {
        user_id: user.uuid,
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    return actionItems.map(
      (actionItem) =>
        new GetActionItemsResDto({
          id: actionItem.id,
          meeting_record_id: actionItem.meeting_record_id,
          user_id: actionItem.user_id,
          assignee: actionItem.assignee,
          task: actionItem.task,
          deadline: actionItem.deadline || undefined,
          is_completed: actionItem.is_completed,
          created_at: actionItem.created_at.toISOString(),
        }),
    );
  }

  async getRecentMeeting(dto: GetRecentMeetingReqDto) {
    const { userId, page, limit } = dto;

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const meetings = await this.prisma.meetingRecord
      .findMany({
        where: {
          user_id: user.uuid,
        },
        skip: (page - 1) * limit,
        take: limit,

        include: {
          action_items: true,
          participants: true,
        },
      })
      .then((meetings) => {
        return meetings.map((meeting) => ({
          ...meeting,
          action_item_counts: meeting.action_items.length,
          participants: meeting.participants.map(
            (participant) => participant.name,
          ),
        }));
      });

    return meetings.map((meeting) => new GetRecentMeetingResDto(meeting));
  }
}
