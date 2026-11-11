import { Module } from '@nestjs/common';
import { DashboardRepository } from 'src/modules/dashboard/features/dashboard.repository';
import { DashboardController } from 'src/modules/dashboard/features/dashboard.controller';
import { AuthModule } from 'src/modules/auth/features/auth.module';
import { MeetingsModule } from 'src/modules/meetings/features/meetings.module';
import { DashboardService } from 'src/modules/dashboard/features/dashboard.service';

@Module({
  imports: [AuthModule, MeetingsModule],
  controllers: [DashboardController],
  providers: [DashboardRepository, DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
