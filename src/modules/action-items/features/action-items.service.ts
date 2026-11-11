import { Injectable, NotFoundException } from '@nestjs/common';
import { UpdateActionItemCompletionReqDto } from 'src/modules/action-items/dtos/req/UpdateActionItemCompletionReq.dto';
import { ActionItemResDto } from 'src/modules/action-items/dtos/res/ActionItemRes.dto';
import { ActionItemsRepository } from 'src/modules/action-items/features/action-items.repository';

@Injectable()
export class ActionItemsService {
  constructor(private readonly actionItemsRepository: ActionItemsRepository) {}

  async updateCompletion(
    id: string,
    userId: string,
    dto: UpdateActionItemCompletionReqDto,
  ): Promise<ActionItemResDto> {
    const item = await this.actionItemsRepository.updateCompletionForOwner(
      id,
      userId,
      dto.isCompleted,
    );

    // 다른 사람의 아이템이어도 존재 여부를 노출하지 않도록 404로 통일한다.
    if (!item) {
      throw new NotFoundException('Action item not found');
    }

    return new ActionItemResDto(item);
  }
}
