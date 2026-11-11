<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ pnpm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

# 영상 기반 AI 회의록 & 액션 아이템 추출 앱 개발 기획 (Vipsum / ActionLens)

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

지금 대용량 동영상 파일까지 ai 파이프라인 구현이 끝났어. 몽고디비에 쌓이는것도 확인했고. 다음에 무슨 작업을 해볼까?
