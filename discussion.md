# 영상 기반 AI 회의록 & 액션 아이템 추출 앱 개발 기획 (cliiptotask)

## 1. 개요 및 주요 기능

- **핵심 컨셉**: 영상/오디오 파일 업로드 후 화자 분리, 회의록 요약, 액션 아이템 추출

- **핵심 기능**:

  - 오디오 기반 화자 분리(Diarization) 및 타임라인 생성

  - 유저가 화자 이름 매핑 (예: Speaker A → 김철수)

  - 요약본 및 액션 아이템(담당자, 기한, 할 일) 자동 구조화 (JSON)

  - 히스토리 내역 조회 및 상태 관리

## 2. 아키텍처 및 기술 스택

- **프론트엔드/모바일**: React Native (Expo)

  - 클라이언트 단 오디오 추출/압축 (FFmpeg bindings)

  - Presigned URL을 활용한 S3/Cloudflare R2 Direct Multipart Upload

- **백엔드**: NestJS + BullMQ (Redis)

  - API Proxy 역할을 통한 API 키 보안 및 사용량 제한(Rate Limiting)

  - 비동기 작업 큐 기반 파이프라인 구성

- **데이터베이스**:

  - **RDB (PostgreSQL 등)**: 유저 정보, 결제/크레딧, 분석 메타데이터, 상태값 (`PENDING`, `PROCESSING`, `COMPLETED`, `REJECTED_VIOLATION` 등)

  - **MongoDB**: 화자, 타임라인, 회의록, 액션 아이템 등 가변적이고 중첩된 상세 분석 결과 JSON 저장

## 3. AI 파이프라인 구성

- **STT & 화자 분리**: Deepgram Nova-2 (화자별 타임스탬프 및 텍스트 추출)

- **LLM & 회의록 추출**: Google Gemini 1.5 Flash/Pro 또는 Claude 3.5 Sonnet / GPT-4o-mini

  - `responseSchema` 기반 Structured Outputs로 타입 안전성 확보

## 4. 예외 처리 및 가드레일 (안전장치)

1. **1차 (클라이언트/백엔드)**: 파일 유효성, 무음(Volume/Silence), 최소/최대 길이 검증

2. **2차 (STT/모더레이션)**:

   - STT `confidence` 점수 미달 시 `FAILED_UNPROCESSABLE` 처리

   - OpenAI Moderation API (`/v1/moderations`) 기반 음란물/유해 텍스트 사전 커트

3. **3차 (LLM 가드레일)**:

   - AI Provider 자체 Safety Settings 반환값 처리

   - System Prompt 내 Escape Hatch (`isProcessable: false`) 정의

   - 악성 유저 경고 및 이용 제한 로직 구성
