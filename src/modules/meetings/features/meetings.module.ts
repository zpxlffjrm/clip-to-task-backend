import { Module } from '@nestjs/common';
import { AuthModule } from 'src/modules/auth/features/auth.module';
import { MeetingProgressModule } from 'src/modules/meetings/features/meeting-progress.module';
import { MeetingsDataModule } from 'src/modules/meetings/features/meetings-data.module';
import { MeetingsController } from 'src/modules/meetings/features/meetings.controller';
import { MeetingsService } from 'src/modules/meetings/features/meetings.service';
import { AiPipelineModule } from 'src/modules/pipeline/pipeline.module';
import { R2Module } from 'src/modules/R2/r2.module';
import { UserModule } from 'src/modules/users/feastures/user.module';

@Module({
  imports: [
    AuthModule,
    MeetingsDataModule,
    MeetingProgressModule,
    R2Module,
    AiPipelineModule,
    UserModule,
  ],
  controllers: [MeetingsController],
  providers: [MeetingsService],
  exports: [MeetingsDataModule, MeetingsService, MeetingProgressModule],
})
export class MeetingsModule {}
