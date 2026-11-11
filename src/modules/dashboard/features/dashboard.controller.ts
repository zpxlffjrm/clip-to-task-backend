import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/features/jwt-auth.guard';
import { GetActionItemsReqDto } from 'src/modules/dashboard/dtos/req/GetActionItemsReq.dto';
import { GetRecentMeetingReqDto } from 'src/modules/dashboard/dtos/req/GetResentMeetingReq.dto';
import { DashboardService } from 'src/modules/dashboard/features/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Post('action-items')
  async getActionItems(@Body() dto: GetActionItemsReqDto) {
    return this.dashboardService.getActionItems(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('recent-meetings')
  async getRecentMeetings(@Body() dto: GetRecentMeetingReqDto) {
    return this.dashboardService.getRecentMeeting(dto);
  }
}
