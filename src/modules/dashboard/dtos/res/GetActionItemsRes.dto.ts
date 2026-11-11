export class GetActionItemsResDto {
  constructor(data: {
    id: string;
    meeting_record_id: string;
    user_id: string;
    assignee?: string;
    task: string;
    deadline?: string;
    is_completed: boolean;
    created_at: string;
  }) {
    this.id = data.id;
    this.meetingRecordId = data.meeting_record_id;
    this.userId = data.user_id;
    this.assignee = data.assignee;
    this.task = data.task;
    this.deadline = data.deadline;
    this.isCompleted = data.is_completed;
    this.createdAt = data.created_at;
  }
  id: string;
  meetingRecordId: string;
  userId: string;
  assignee?: string;
  task: string;
  deadline?: string;
  isCompleted: boolean;
  createdAt: string;
}
