import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeepgramClient, DeepgramError } from '@deepgram/sdk';
import { createReadStream } from 'node:fs';

@Injectable()
export class DeepgramService {
  private readonly deepgram: DeepgramClient;

  constructor(private readonly configService: ConfigService) {
    this.deepgram = new DeepgramClient({
      apiKey: this.configService.getOrThrow<string>('DEEPGRAM_API_KEY'),
    });
  }

  async callDeepgram(audioFilePath: string) {
    try {
      const result = await this.deepgram.listen.v1.media.transcribeFile(
        createReadStream(audioFilePath),
        {
          model: 'nova-3',
          language: 'ko',
          diarize: true,
          punctuate: true,
          // callback:"",
          // callback_method: "POST",
        },
        { timeoutInSeconds: 60 * 60 * 24 },
      );

      if (!('results' in result)) {
        throw new Error('Deepgram 비동기 응답은 지원하지 않습니다.');
      }

      const alternative = result.results.channels?.[0]?.alternatives?.[0];
      const words = alternative?.words ?? [];
      const text = alternative?.transcript ?? '';

      const speakerSet = new Set<string>();
      const timeline: Array<{
        startTime: number;
        endTime: number;
        speaker: string;
        text: string;
      }> = [];

      for (const wordInfo of words) {
        const wordWithExtras = wordInfo as typeof wordInfo & {
          speaker?: number;
          punctuated_word?: string;
        };

        const speaker = `Speaker_${wordWithExtras.speaker ?? 0}`;
        speakerSet.add(speaker);

        const wordText =
          wordWithExtras.punctuated_word || wordWithExtras.word || '';
        const startTime = wordWithExtras.start ?? 0;
        const endTime = wordWithExtras.end ?? 0;
        const lastSegment = timeline.at(-1);

        if (lastSegment && lastSegment.speaker === speaker) {
          lastSegment.endTime = endTime;
          lastSegment.text = lastSegment.text
            ? `${lastSegment.text} ${wordText}`
            : wordText;
          continue;
        }

        timeline.push({
          startTime,
          endTime,
          speaker,
          text: wordText,
        });
      }

      return {
        text,
        timeline,
        speakers: Array.from(speakerSet),
      };
    } catch (error) {
      if (error instanceof DeepgramError) {
        throw new Error(`Deepgram 변환 실패: ${error.message}`);
      }
      throw error;
    }
  }
}
