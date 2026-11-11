import { JobStatus } from 'generated/prisma/enums';

export type MeetingProgressStage =
  | 'pending'
  | 'uploaded'
  | 'preprocess'
  | 'preprocessed'
  | 'processing'
  | 'stt'
  | 'llm'
  | 'completed'
  | 'failed';

/** 프론트 대시보드용 진행률 페이로드 */
export type MeetingProgressPayload = {
  title: string;
  step: string;
  progress: string;
};

export const MEETING_PROGRESS_EVENT = 'meeting.progress';

const STEP_LABEL: Record<MeetingProgressStage, string> = {
  pending: '업로드 대기 중',
  uploaded: '업로드 완료, 처리 대기 중',
  preprocess: '미디어 전처리 중',
  preprocessed: '전처리 완료',
  processing: '음성 분석 준비 중',
  stt: 'Deepgram 화자 분리 진행 중',
  llm: '회의 제목·요약 생성 중',
  completed: '처리 완료',
  failed: '처리 실패',
};

/** 전처리 세부 step (percent는 preprocess stage로 유지) */
export const PREPROCESS_STEP = {
  download: '원본 파일 다운로드 중',
  probe: '미디어 정보 확인 중',
  convert: '오디오 변환 중',
  upload: '전처리 파일 업로드 중',
} as const;

/** 오디오 파이프라인 세부 step */
export const AUDIO_STEP = {
  download: '분석용 오디오 다운로드 중',
  stt: 'Deepgram 화자 분리 진행 중',
  llm: '회의 제목·요약 생성 중',
  save: '분석 결과 저장 중',
} as const;

export function stepLabel(stage: MeetingProgressStage): string {
  return STEP_LABEL[stage];
}

export function formatProgress(percent: number): string {
  return `${Math.max(0, Math.min(100, Math.round(percent)))}%`;
}

export function toProgressPayload(
  title: string,
  percent: number,
  stage: MeetingProgressStage,
  stepOverride?: string,
): MeetingProgressPayload {
  return {
    title,
    step: stepOverride ?? stepLabel(stage),
    progress: formatProgress(percent),
  };
}

export function stageFromPercent(
  percent: number,
  status: JobStatus,
): MeetingProgressStage {
  if (
    status === JobStatus.FAILED_UNPROCESSABLE ||
    status === JobStatus.REJECTED_VIOLATION
  ) {
    return 'failed';
  }

  if (percent >= 100 || status === JobStatus.COMPLETED) {
    return 'completed';
  }
  if (percent >= 90) {
    return 'llm';
  }
  if (percent >= 65) {
    return 'stt';
  }
  if (percent >= 50) {
    return 'processing';
  }
  if (percent >= 40) {
    return 'preprocessed';
  }
  if (percent >= 20) {
    return 'preprocess';
  }
  if (percent >= 10) {
    return 'uploaded';
  }
  return 'pending';
}
