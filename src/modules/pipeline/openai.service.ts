import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface ActionItem {
  assignee: string;
  task: string;
  deadline: string;
}

interface Participant {
  name: string;
  speakerLabel: string;
}

interface MeetingResult {
  title: string;
  summary: string[];
  actionItems: ActionItem[];
  participants: Participant[];
}

@Injectable()
export class LlmService {
  private readonly openai: OpenAI;
  constructor(private readonly configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  async callLLM(text: string, speakers: string[] = []) {
    const speakerHint =
      speakers.length > 0
        ? `\n화자 라벨 목록: ${speakers.join(', ')}\n각 화자 라벨에 대응하는 실제 참석자 이름을 추론해 participants에 넣으세요. 이름을 알 수 없으면 화자 라벨을 name으로 사용하세요.`
        : '\n회의 참석자 이름을 participants에 추출하세요.';

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `회의록 전문을 보고 요약, 참석자를 추출하세요. 또한 회의록 전문을 통해 상세한 액션 아이템 목록을 추출해야 합니다. ${speakerHint}`,
        },
        { role: 'user', content: text },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'meeting_result',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              summary: { type: 'array', items: { type: 'string' } },
              title: { type: 'string' },
              actionItems: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    assignee: { type: 'string' },
                    task: { type: 'string' },
                    deadline: { type: 'string' },
                  },
                  required: ['assignee', 'task', 'deadline'],
                  additionalProperties: false,
                },
              },
              participants: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    speakerLabel: { type: 'string' },
                  },
                  required: ['name', 'speakerLabel'],
                  additionalProperties: false,
                },
              },
            },
            required: ['summary', 'title', 'actionItems', 'participants'],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message?.content;
    if (!content) {
      throw new Error('LLM 응답이 비어있습니다.');
    }

    const result = JSON.parse(content) as MeetingResult;

    return {
      title: result.title,
      summary: result.summary,
      actionItems: result.actionItems.map((item) => ({
        ...item,
        isCompleted: false,
      })),
      participants: result.participants,
    };
  }
}
