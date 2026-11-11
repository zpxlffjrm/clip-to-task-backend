import { v4 as uuidv4 } from 'uuid';

import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateUserDto } from 'src/modules/users/dtos/req/CreateUserDto';
import { User } from 'generated/prisma/client';
import { SaveTokenDto } from 'src/modules/auth/dtos/req/SaveTokenDto';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(data: CreateUserDto): Promise<User> {
    const now = new Date();

    return await this.prisma.user.create({
      data: {
        id: data.name,
        email: data.email,
        password: data.password,
        created_at: now,
        updated_at: now,
        password_changed_at: now,
        uuid: uuidv4(),
      },
    });
  }

  async saveToken(data: SaveTokenDto): Promise<void> {
    await this.prisma.token.upsert({
      where: {
        user_id: data.userId,
      },
      create: {
        user_id: data.userId,
        access_token: data.accessToken,
        refresh_token: data.refreshToken,
      },
      update: {
        access_token: data.accessToken,
        refresh_token: data.refreshToken,
      },
    });
  }

  async clearToken(userId: string): Promise<void> {
    await this.prisma.token.updateMany({
      where: { user_id: userId },
      data: {
        access_token: null,
        refresh_token: null,
      },
    });
  }

  async findAccessTokenByUserId(userId: string): Promise<string | null> {
    const token = await this.prisma.token.findUnique({
      where: { user_id: userId },
      select: { access_token: true },
    });

    return token?.access_token ?? null;
  }

  async findRefreshTokenByUserId(userId: string): Promise<string | null> {
    const token = await this.prisma.token.findUnique({
      where: { user_id: userId },
      select: { refresh_token: true },
    });

    return token?.refresh_token ?? null;
  }

  async findUserByUuid(uuid: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { uuid },
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: { id },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: { email },
    });
  }
}
