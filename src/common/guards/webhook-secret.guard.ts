import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'crypto';
import { Request } from 'express';

export const WEBHOOK_SECRET_HEADER = 'x-webhook-secret';
export const WEBHOOK_SECRET_ENV = 'MEETING_WEBHOOK_SECRET';

/**
 * 스토리지 업로드 웹훅처럼 사용자 토큰이 없는 서버 간 호출을 보호한다.
 * 호출 측은 `x-webhook-secret` 헤더에 MEETING_WEBHOOK_SECRET 값을 담아 보내야 한다.
 * 환경 변수가 비어 있으면 모든 요청을 거부한다(fail closed).
 */
@Injectable()
export class WebhookSecretGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.get<string>(WEBHOOK_SECRET_ENV);
    if (!expected) {
      throw new UnauthorizedException('Webhook secret is not configured');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers[WEBHOOK_SECRET_HEADER];
    if (typeof provided !== 'string' || provided.length === 0) {
      throw new UnauthorizedException('Missing webhook secret');
    }

    // 길이 차이로 인한 타이밍 노출을 막기 위해 해시를 비교한다.
    const a = createHash('sha256').update(provided).digest();
    const b = createHash('sha256').update(expected).digest();
    if (!timingSafeEqual(a, b)) {
      throw new UnauthorizedException('Invalid webhook secret');
    }

    return true;
  }
}
