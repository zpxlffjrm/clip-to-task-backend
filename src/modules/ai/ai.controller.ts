import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from 'src/modules/ai/ai.service';
import { JwtAuthGuard } from 'src/modules/auth/features/jwt-auth.guard';

type UploadedAudioFile = {
  buffer: Buffer;
  mimetype: string;
};

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @UseGuards(JwtAuthGuard)
  @Post('voice-prompt')
  @UseInterceptors(FileInterceptor('file'))
  async handleVoicePrompt(@UploadedFile() file?: UploadedAudioFile) {
    if (!file) {
      throw new BadRequestException('오디오 파일이 필요합니다.');
    }

    return await this.aiService.processAudioToClaude(
      file.buffer,
      file.mimetype,
    );
  }
}
