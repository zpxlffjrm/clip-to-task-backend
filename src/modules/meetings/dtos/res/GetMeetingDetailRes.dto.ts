export class ActionItemDto {
  assignee!: string; // 유저가 매핑한 담당자 이름

  task!: string;

  dueDate?: string;
}

export class UtteranceDto {
  speakerId!: string; // 원본 화자 ID (예: Speaker A)

  speakerName?: string; // 유저 매핑 이름

  startTime!: number;

  endTime!: number;

  text!: string;
}

export class GetMeetingDetailResDto {
  id!: string; // RDB PK

  title!: string;

  status!: string;

  duration!: number;

  createdAt!: string;

  summary!: string;

  actionItems!: ActionItemDto[];

  utterances!: UtteranceDto[];
}
