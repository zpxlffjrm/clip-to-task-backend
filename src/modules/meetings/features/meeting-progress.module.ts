import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthRepository } from 'src/modules/auth/features/auth.repository';
import { jwtConstants } from 'src/modules/auth/features/constants';
import { MeetingProgressGateway } from 'src/modules/meetings/features/meeting-progress.gateway';
import { MeetingProgressService } from 'src/modules/meetings/features/meeting-progress.service';
import { MeetingsDataModule } from 'src/modules/meetings/features/meetings-data.module';
import { PrismaModule } from 'src/modules/prisma/prisma.module';

@Module({
  imports: [
    MeetingsDataModule,
    PrismaModule,
    JwtModule.register({
      secret: jwtConstants.accessSecret,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  providers: [MeetingProgressService, MeetingProgressGateway, AuthRepository],
  exports: [MeetingProgressService],
})
export class MeetingProgressModule {}
