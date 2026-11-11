import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  type CurrentUserPayload,
} from 'src/common/decorators/current-user.decorator';
import { UpdateActionItemCompletionReqDto } from 'src/modules/action-items/dtos/req/UpdateActionItemCompletionReq.dto';
import { ActionItemResDto } from 'src/modules/action-items/dtos/res/ActionItemRes.dto';
import { ActionItemsService } from 'src/modules/action-items/features/action-items.service';
import { JwtAuthGuard } from 'src/modules/auth/features/jwt-auth.guard';

@Controller('action-items')
export class ActionItemsController {
  constructor(private readonly actionItemsService: ActionItemsService) {}

  @UseGuards(JwtAuthGuard)
  @Patch(':id/completion')
  async updateCompletion(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateActionItemCompletionReqDto,
  ): Promise<ActionItemResDto> {
    return await this.actionItemsService.updateCompletion(id, user.userId, dto);
  }
}
