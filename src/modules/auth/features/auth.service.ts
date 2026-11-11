import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from 'src/modules/auth/features/auth.repository';
import { CreateUserDto } from 'src/modules/users/dtos/req/CreateUserDto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SignInResponseDto } from 'src/modules/auth/dtos/res/SignInDto';
import { SignInReqDto } from 'src/modules/auth/dtos/req/SignInReqDto';
import { differenceInDays } from 'date-fns';
import { User } from 'generated/prisma/client';
import { RefreshTokenDto } from 'src/modules/auth/dtos/req/RefreshTokenDto';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  private async issueTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const payload = {
      sub: user.uuid,
      email: user.email,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '1h',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '30d',
    });

    await this.authRepository.saveToken({
      userId: user.uuid,
      accessToken,
      refreshToken: await bcrypt.hash(refreshToken, 10),
    });

    return { accessToken, refreshToken };
  }

  async signUp(data: CreateUserDto): Promise<SignInResponseDto> {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.authRepository.createUser({
      ...data,
      password: hashedPassword,
    });

    const tokens = await this.issueTokens(user);

    return {
      ...tokens,
      shouldChangePassword: false,
    };
  }

  async signIn(data: SignInReqDto): Promise<SignInResponseDto> {
    const user = await this.authRepository.findUserById(data.name);

    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const shouldChangePassword =
      differenceInDays(new Date(), user.password_changed_at) >= 90;

    const tokens = await this.issueTokens(user);

    return {
      ...tokens,
      shouldChangePassword,
    };
  }

  async signOut(userId: string): Promise<void> {
    await this.authRepository.clearToken(userId);
  }

  async refresh(data: RefreshTokenDto): Promise<SignInResponseDto> {
    let payload: { sub: string; email: string };

    try {
      payload = await this.jwtService.verifyAsync<{
        sub: string;
        email: string;
      }>(data.refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.authRepository.findUserByUuid(payload.sub);

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const storedRefreshToken =
      await this.authRepository.findRefreshTokenByUserId(user.uuid);

    if (
      !storedRefreshToken ||
      !(await bcrypt.compare(data.refreshToken, storedRefreshToken))
    ) {
      await this.authRepository.clearToken(user.uuid);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.issueTokens(user);

    return {
      ...tokens,
      shouldChangePassword:
        differenceInDays(new Date(), user.password_changed_at) >= 90,
    };
  }
}
