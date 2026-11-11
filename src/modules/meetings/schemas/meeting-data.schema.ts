import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MeetingDataDocument = HydratedDocument<MeetingData>;

@Schema({ _id: false })
export class TimelineItem {
  @Prop({ required: true })
  startTime: number;

  @Prop({ required: true })
  endTime: number;

  @Prop({ required: true })
  speaker: string;

  @Prop({ required: true })
  text: string;
}

@Schema({ _id: false })
export class ActionItem {
  @Prop({ required: true })
  assignee: string;

  @Prop({ required: true })
  task: string;

  @Prop({ required: true })
  deadline: string;

  @Prop({ default: false })
  isCompleted: boolean;
}

@Schema({ timestamps: true, collection: 'meeting_data' })
export class MeetingData {
  @Prop({ required: true, index: true })
  meetingRecordId: string;

  @Prop({ type: Object, default: {} })
  speakerMapping: Record<string, string>;

  @Prop({ type: [TimelineItem], default: [] })
  timeline: TimelineItem[];

  @Prop({ type: [String], default: [] })
  summary: string[];

  @Prop({ type: String, default: '' })
  title: string;

  @Prop({ type: [ActionItem], default: [] })
  actionItems: ActionItem[];

  @Prop({ type: Object })
  rawAiData: Record<string, unknown>;
}

export const MeetingDataSchema = SchemaFactory.createForClass(MeetingData);
