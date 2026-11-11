import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiController } from 'src/modules/ai/ai.controller';
import { AiService } from 'src/modules/ai/ai.service';
import { AuthModule } from 'src/modules/auth/features/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
