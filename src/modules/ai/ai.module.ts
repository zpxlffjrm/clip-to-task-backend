import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from 'src/modules/ai/ai.controller';
import { AiService } from 'src/modules/ai/ai.service';

@Module({
  imports: [ConfigModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
