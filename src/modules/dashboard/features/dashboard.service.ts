import { Injectable } from '@nestjs/common';
import { GetActionItemsReqDto } from 'src/modules/dashboard/dtos/req/GetActionItemsReq.dto';
import { GetRecentMeetingReqDto } from 'src/modules/dashboard/dtos/req/GetResentMeetingReq.dto';
import { DashboardRepository } from 'src/modules/dashboard/features/dashboard.repository';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getActionItems(dto: GetActionItemsReqDto) {
    return this.dashboardRepository.getActionItems(dto);
  }

  async getRecentMeeting(dto: GetRecentMeetingReqDto) {
    return this.dashboardRepository.getRecentMeeting(dto);
  }
}
