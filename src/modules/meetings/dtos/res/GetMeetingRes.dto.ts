import { MeetingRecord } from 'generated/prisma/browser';
import {
  ActionItem,
  MeetingData,
  TimelineItem,
} from 'src/modules/meetings/schemas/meeting-data.schema';

export class GetMeetingResDto {
  id?: string;
  title: string;
  status?: string;
  duration: number;
  createdAt: string;

  actionItems: ActionItem[];
  summary: string[];
  timeline: TimelineItem[];

  speakerMapping: Record<string, string>;

  constructor(meeting: Partial<MeetingRecord> & Partial<MeetingData>) {
    this.id = meeting.id;
    this.title = meeting.title ?? '';
    this.status = meeting.status;
    this.duration = meeting.duration_sec ?? 0;
    this.createdAt = meeting.created_at?.toISOString() ?? '';
    this.actionItems = meeting.actionItems ?? [];
    this.summary = meeting.summary ?? [];
    this.timeline = meeting.timeline ?? [];
    this.speakerMapping = meeting.speakerMapping ?? {};
  }
}
