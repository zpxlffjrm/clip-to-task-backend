import { Injectable } from '@nestjs/common';
import { ActionItem } from 'generated/prisma/browser';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class ActionItemsRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 본인 소유(user_id 일치)인 액션 아이템만 갱신한다.
   * 소유자가 아니거나 존재하지 않으면 null을 반환한다.
   */
  async updateCompletionForOwner(
    id: string,
    userId: string,
    isCompleted: boolean,
  ): Promise<ActionItem | null> {
    const { count } = await this.prisma.actionItem.updateMany({
      where: { id, user_id: userId },
      data: { is_completed: isCompleted },
    });

    if (count === 0) {
      return null;
    }

    return await this.prisma.actionItem.findUnique({ where: { id } });
  }
}
