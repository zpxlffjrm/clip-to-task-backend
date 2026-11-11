import { forwardRef, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthRepository } from 'src/modules/auth/features/auth.repository';
import { MeetingProgressService } from 'src/modules/meetings/features/meeting-progress.service';
import {
  MEETING_PROGRESS_EVENT,
  MeetingProgressPayload,
} from 'src/modules/meetings/features/meeting-progress.types';

type JwtPayload = {
  sub: string;
  email: string;
};

function resolveCorsOrigins(): string[] | boolean {
  const corsOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return corsOrigins?.length ? corsOrigins : false;
}

@WebSocketGateway({
  namespace: '/meeting-progress',
  cors: {
    origin: resolveCorsOrigins(),
    credentials: true,
  },
})
export class MeetingProgressGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(MeetingProgressGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly authRepository: AuthRepository,
    @Inject(forwardRef(() => MeetingProgressService))
    private readonly meetingProgressService: MeetingProgressService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);

      console.log('token', token);
      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const storedAccessToken =
        await this.authRepository.findAccessTokenByUserId(payload.sub);

      if (!storedAccessToken || storedAccessToken !== token) {
        client.disconnect(true);
        return;
      }

      const userId = payload.sub;
      client.data.userId = userId;
      await client.join(this.userRoom(userId));

      const snapshot =
        await this.meetingProgressService.getActiveProgress(userId);
      client.emit(MEETING_PROGRESS_EVENT, snapshot);
    } catch (error) {
      this.logger.warn(
        `Socket auth failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data?.userId as string | undefined;
    if (userId) {
      void client.leave(this.userRoom(userId));
    }
  }

  emitToUser(
    userId: string,
    event: string,
    payload: MeetingProgressPayload | null,
  ): void {
    this.server.to(this.userRoom(userId)).emit(event, payload);
  }

  private userRoom(userId: string): string {
    return `user:${userId}`;
  }

  private extractToken(client: Socket): string | null {
    const authToken = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length).trim();
    }

    return null;
  }
}
