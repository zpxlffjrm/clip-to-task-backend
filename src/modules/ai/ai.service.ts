import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeepgramClient, DeepgramError } from '@deepgram/sdk';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AiService {
  private deepgram: DeepgramClient;
  private anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    this.deepgram = new DeepgramClient({
      apiKey: this.configService.getOrThrow<string>('DEEPGRAM_API_KEY'),
    });
    this.anthropic = new Anthropic({
      apiKey: this.configService.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  // 1. Deepgram: 오디오 버퍼를 텍스트로 변환 (STT)
  async transcribeAudio(
    audioBuffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    try {
      const result = await this.deepgram.listen.v1.media.transcribeFile(
        {
          data: audioBuffer,
          contentType: mimeType,
        },
        {
          model: 'nova-2',
          smart_format: true,
        },
      );

      if (!('results' in result)) {
        throw new Error('Deepgram 비동기 응답은 지원하지 않습니다.');
      }

      return result.results.channels[0]?.alternatives?.[0]?.transcript ?? '';
    } catch (error) {
      if (error instanceof DeepgramError) {
        throw new Error(`Deepgram 변환 실패: ${error.message}`);
      }
      throw error;
    }
  }

  // 2. Claude: 텍스트를 입력받아 답변 생성
  async askClaude(prompt: string): Promise<string> {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    return '';
  }

  // 3. 음성 파일 -> STT -> Claude 전체 파이프라인
  async processAudioToClaude(audioBuffer: Buffer, mimeType: string) {
    const transcript = await this.transcribeAudio(audioBuffer, mimeType);

    if (!transcript.trim()) {
      return { transcript: '', response: '음성을 인식하지 못했습니다.' };
    }

    const aiResponse = await this.askClaude(transcript);

    return {
      transcript,
      response: aiResponse,
    };
  }
}
