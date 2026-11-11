import { Module } from '@nestjs/common';
import { ActionItemsController } from 'src/modules/action-items/features/action-items.controller';
import { ActionItemsRepository } from 'src/modules/action-items/features/action-items.repository';
import { ActionItemsService } from 'src/modules/action-items/features/action-items.service';
import { AuthModule } from 'src/modules/auth/features/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ActionItemsController],
  providers: [ActionItemsRepository, ActionItemsService],
})
export class ActionItemsModule {}
