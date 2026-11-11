import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  type CurrentUserPayload,
} from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/modules/auth/features/jwt-auth.guard';
import { CloudfrontWebHookReqDto } from 'src/modules/meetings/dtos/req/CloudfrontWebHoolReq.dto';
import { CreateRecordReqDto } from 'src/modules/meetings/dtos/req/CreateRecordReq.dto';
import { GetMeetingsReqDto } from 'src/modules/meetings/dtos/req/GetMeetingsReq.dto';
import { GetMeetingResDto } from 'src/modules/meetings/dtos/res/GetMeetingRes.dto';
import { GetMeetingsResDto } from 'src/modules/meetings/dtos/res/GetMeetingsRes.dto';
import { MeetingsService } from 'src/modules/meetings/features/meetings.service';

@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getMeetings(
    @CurrentUser() user: CurrentUserPayload,
    @Query() req: GetMeetingsReqDto,
  ): Promise<GetMeetingsResDto[]> {
    console.log(user);
    return await this.meetingsService.getMeetings(req, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getMeeting(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<GetMeetingResDto> {
    return await this.meetingsService.getMeeting({ id }, user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createMeeting(
    @Body() dto: CreateRecordReqDto,
  ): Promise<{ uploadUrl: string; meetingId: string }> {
    return await this.meetingsService.createRecord(dto);
  }

  @Post('cloudfront-upload-webhook')
  async cloudfrontWebHook(@Body() dto: CloudfrontWebHookReqDto): Promise<void> {
    console.log(dto);
    return await this.meetingsService.cloudfrontUploadWebHook(dto);
  }

  @Post('cloudfront-audio-webhook')
  async cloudfrontAudioWebHook(
    @Body() dto: CloudfrontWebHookReqDto,
  ): Promise<void> {
    console.log(dto);
    return await this.meetingsService.cloudfrontAudioWebHook(dto);
  }
}
