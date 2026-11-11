import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { RefreshTokenDto } from 'src/modules/auth/dtos/req/RefreshTokenDto';
import { SignInReqDto } from 'src/modules/auth/dtos/req/SignInReqDto';
import { SignInResponseDto } from 'src/modules/auth/dtos/res/SignInDto';
import { AuthService } from 'src/modules/auth/features/auth.service';
import { JwtAuthGuard } from 'src/modules/auth/features/jwt-auth.guard';
import { CreateUserDto } from 'src/modules/users/dtos/req/CreateUserDto';

type AuthenticatedRequest = Request & {
  user: {
    userId: string;
    email: string;
  };
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('sign-up')
  async signUp(@Body() data: CreateUserDto): Promise<SignInResponseDto> {
    return await this.authService.signUp(data);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('sign-in')
  async signIn(@Body() data: SignInReqDto): Promise<SignInResponseDto> {
    console.log(data);
    return await this.authService.signIn(data);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('sign-in/refresh')
  async refresh(@Body() data: RefreshTokenDto): Promise<SignInResponseDto> {
    return await this.authService.refresh(data);
  }

  @UseGuards(JwtAuthGuard)
  @Post('sign-out')
  async signOut(@Req() req: AuthenticatedRequest): Promise<{ ok: true }> {
    await this.authService.signOut(req.user.userId);
    return { ok: true };
  }
}
