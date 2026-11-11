import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  WEBHOOK_SECRET_ENV,
  WEBHOOK_SECRET_HEADER,
  WebhookSecretGuard,
} from 'src/common/guards/webhook-secret.guard';
import { AiController } from 'src/modules/ai/ai.controller';
import { AiService } from 'src/modules/ai/ai.service';
import { AuthRepository } from 'src/modules/auth/features/auth.repository';
import { jwtConstants } from 'src/modules/auth/features/constants';
import { JwtAuthGuard } from 'src/modules/auth/features/jwt-auth.guard';
import { JwtStrategy } from 'src/modules/auth/features/jwt.strategy';
import { MeetingsController } from 'src/modules/meetings/features/meetings.controller';
import { MeetingsService } from 'src/modules/meetings/features/meetings.service';

// 실제 구현은 DB·외부 SDK(ESM uuid 등)를 끌어오므로 클래스 토큰만 남긴다.
jest.mock('src/modules/auth/features/auth.repository', () => ({
  AuthRepository: class AuthRepository {},
}));
jest.mock('src/modules/meetings/features/meetings.service', () => ({
  MeetingsService: class MeetingsService {},
}));
jest.mock('src/modules/ai/ai.service', () => ({
  AiService: class AiService {},
}));

const USER_UUID = '11111111-1111-1111-1111-111111111111';
const WEBHOOK_SECRET = 'test-webhook-secret';

describe('Meeting upload / webhook / voice-prompt auth', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  const meetingsService = {
    createRecord: jest.fn().mockResolvedValue({
      uploadUrl: 'https://upload',
      meetingId: 'm1',
    }),
    cloudfrontUploadWebHook: jest.fn().mockResolvedValue(undefined),
    cloudfrontAudioWebHook: jest.fn().mockResolvedValue(undefined),
  };
  const aiService = {
    processAudioToClaude: jest.fn().mockResolvedValue({ ok: true }),
  };
  const authRepository = {
    findAccessTokenByUserId: jest.fn(),
  };

  beforeAll(async () => {
    process.env[WEBHOOK_SECRET_ENV] = WEBHOOK_SECRET;

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ ignoreEnvFile: true }), PassportModule],
      controllers: [MeetingsController, AiController],
      providers: [
        JwtStrategy,
        JwtAuthGuard,
        WebhookSecretGuard,
        { provide: AuthRepository, useValue: authRepository },
        { provide: MeetingsService, useValue: meetingsService },
        { provide: AiService, useValue: aiService },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    accessToken = new JwtService().sign(
      { sub: USER_UUID, email: 'a@b.c' },
      { secret: jwtConstants.accessSecret, expiresIn: '1h' },
    );
    authRepository.findAccessTokenByUserId.mockResolvedValue(accessToken);
  });

  afterAll(async () => {
    await app.close();
    delete process.env[WEBHOOK_SECRET_ENV];
  });

  beforeEach(() => jest.clearAllMocks());

  describe('POST /meetings', () => {
    it('rejects requests without a token', async () => {
      await request(app.getHttpServer())
        .post('/meetings')
        .send({ fileName: 'a.m4a', fileType: 'audio/m4a' })
        .expect(401);
      expect(meetingsService.createRecord).not.toHaveBeenCalled();
    });

    it('uses the user from the token, not the body', async () => {
      await request(app.getHttpServer())
        .post('/meetings')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: 'someone-else',
          fileName: 'a.m4a',
          fileType: 'audio/m4a',
        })
        .expect(201);
      expect(meetingsService.createRecord).toHaveBeenCalledWith(
        USER_UUID,
        expect.objectContaining({ fileName: 'a.m4a', fileType: 'audio/m4a' }),
      );
    });
  });

  describe.each(['cloudfront-upload-webhook', 'cloudfront-audio-webhook'])(
    'POST /meetings/%s',
    (path) => {
      const body = { key: 'users/x/uploads/a.m4a', bucket: 'b' };

      it('rejects requests without the secret header', async () => {
        await request(app.getHttpServer())
          .post(`/meetings/${path}`)
          .send(body)
          .expect(401);
      });

      it('rejects a wrong secret', async () => {
        await request(app.getHttpServer())
          .post(`/meetings/${path}`)
          .set(WEBHOOK_SECRET_HEADER, 'wrong')
          .send(body)
          .expect(401);
      });

      it('accepts the correct secret', async () => {
        await request(app.getHttpServer())
          .post(`/meetings/${path}`)
          .set(WEBHOOK_SECRET_HEADER, WEBHOOK_SECRET)
          .send(body)
          .expect(201);
      });
    },
  );

  it('rejects webhooks when the secret is not configured', async () => {
    const saved = process.env[WEBHOOK_SECRET_ENV];
    delete process.env[WEBHOOK_SECRET_ENV];
    try {
      await request(app.getHttpServer())
        .post('/meetings/cloudfront-upload-webhook')
        .set(WEBHOOK_SECRET_HEADER, '')
        .send({ key: 'k', bucket: 'b' })
        .expect(401);
    } finally {
      process.env[WEBHOOK_SECRET_ENV] = saved;
    }
    expect(meetingsService.cloudfrontUploadWebHook).not.toHaveBeenCalled();
  });

  describe('POST /ai/voice-prompt', () => {
    it('rejects requests without a token', async () => {
      await request(app.getHttpServer())
        .post('/ai/voice-prompt')
        .attach('file', Buffer.from('abc'), {
          filename: 'a.m4a',
          contentType: 'audio/m4a',
        })
        .expect(401);
      expect(aiService.processAudioToClaude).not.toHaveBeenCalled();
    });

    it('accepts authenticated requests', async () => {
      await request(app.getHttpServer())
        .post('/ai/voice-prompt')
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('abc'), {
          filename: 'a.m4a',
          contentType: 'audio/m4a',
        })
        .expect(201);
    });
  });
});
