import {
  ActionItem,
  MeetingParticipant,
  MeetingRecord,
} from 'generated/prisma/browser';
import { TimelineItem } from 'src/modules/meetings/schemas/meeting-data.schema';

export class MeetingActionItemResDto {
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

export class MeetingParticipantResDto {
  constructor(participant: MeetingParticipant) {
    this.id = participant.id;
    this.meetingRecordId = participant.meeting_record_id;
    this.name = participant.name;
    this.speakerLabel = participant.speaker_label ?? undefined;
    this.createdAt = participant.created_at.toISOString();
  }

  id: string;
  meetingRecordId: string;
  name: string;
  speakerLabel?: string;
  createdAt: string;
}

export class GetMeetingsResDto {
  constructor(
    meeting: MeetingRecord & {
      action_items: ActionItem[];
      participants: MeetingParticipant[];
      summary: string[];
      timeline: TimelineItem[];
    },
  ) {
    this.id = meeting.id;
    this.title = meeting.title ?? '';
    this.status = meeting.status;
    this.duration = meeting.duration_sec ?? 0;
    this.createdAt = meeting.created_at?.toISOString() ?? '';
    this.actionItems = meeting.action_items.map(
      (item) => new MeetingActionItemResDto(item),
    );
    this.participants = meeting.participants.map(
      (participant) => new MeetingParticipantResDto(participant),
    );
    this.summary = meeting.summary;
    this.timeline = meeting.timeline;
  }

  id!: string; // RDB PK

  title!: string;

  status!: string;

  duration!: number;

  createdAt!: string;

  actionItems: MeetingActionItemResDto[];

  participants: MeetingParticipantResDto[];
  summary: string[];
  timeline: TimelineItem[];
}
