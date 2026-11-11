import { MeetingRecord } from 'generated/prisma/browser';

export class GetRecentMeetingResDto {
  constructor(
    meeting: MeetingRecord & {
      action_item_counts: number;
      participants: string[];
    },
  ) {
    this.id = meeting.id;
    this.title = meeting.title ?? '';
    this.status = meeting.status;
    this.duration = meeting.duration_sec ?? 0;
    this.createdAt = meeting.created_at?.toISOString() ?? '';
    this.actionItemCounts = meeting.action_item_counts ?? 0;
    this.participants = meeting.participants ?? [];
  }

  id!: string; // RDB PK

  title!: string;

  status!: string;

  duration!: number;

  createdAt!: string;

  actionItemCounts: number;
  participants: string[];
}
