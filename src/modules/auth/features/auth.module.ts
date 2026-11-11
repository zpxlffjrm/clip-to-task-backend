import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from 'src/modules/auth/features/auth.controller';
import { AuthRepository } from 'src/modules/auth/features/auth.repository';
import { AuthService } from 'src/modules/auth/features/auth.service';
import { jwtConstants } from 'src/modules/auth/features/constants';
import { JwtAuthGuard } from 'src/modules/auth/features/jwt-auth.guard';
import { JwtStrategy } from 'src/modules/auth/features/jwt.strategy';
import { PrismaModule } from 'src/modules/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: jwtConstants.accessSecret,
      signOptions: { expiresIn: '1h' },
    }),
    PassportModule,
  ],
  providers: [AuthService, AuthRepository, JwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard],
  controllers: [AuthController],
})
export class AuthModule {}
