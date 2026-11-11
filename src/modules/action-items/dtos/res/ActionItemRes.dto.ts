import { ActionItem } from 'generated/prisma/browser';

export class ActionItemResDto {
  constructor(item: ActionItem) {
    this.id = item.id;
    this.meetingRecordId = item.meeting_record_id;
    this.userId = item.user_id;
    this.assignee = item.assignee;
    this.task = item.task;
    this.deadline = item.deadline ?? undefined;
    this.isCompleted = item.is_completed;
    this.createdAt = item.created_at.toISOString();
  }

  id: string;
  meetingRecordId: string;
  userId: string;
  assignee: string;
  task: string;
  deadline?: string;
  isCompleted: boolean;
  createdAt: string;
}
