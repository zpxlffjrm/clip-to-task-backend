import { NotFoundException } from '@nestjs/common';
import { ActionItem } from 'generated/prisma/browser';
import { ActionItemsRepository } from 'src/modules/action-items/features/action-items.repository';
import { ActionItemsService } from 'src/modules/action-items/features/action-items.service';

describe('ActionItemsService', () => {
  const item: ActionItem = {
    id: '11111111-1111-4111-8111-111111111111',
    meeting_record_id: '22222222-2222-4222-8222-222222222222',
    user_id: '33333333-3333-4333-8333-333333333333',
    assignee: '김철수',
    task: '회의록 공유하기',
    deadline: null,
    is_completed: true,
    created_at: new Date('2026-11-11T00:00:00.000Z'),
  };

  const updateCompletionForOwner = jest.fn();
  const service = new ActionItemsService({
    updateCompletionForOwner,
  } as unknown as ActionItemsRepository);

  beforeEach(() => updateCompletionForOwner.mockReset());

  it('returns the updated item for its owner', async () => {
    updateCompletionForOwner.mockResolvedValue(item);

    const res = await service.updateCompletion(item.id, item.user_id, {
      isCompleted: true,
    });

    expect(updateCompletionForOwner).toHaveBeenCalledWith(
      item.id,
      item.user_id,
      true,
    );
    expect(res.isCompleted).toBe(true);
    expect(res.id).toBe(item.id);
  });

  it('throws 404 when the item is missing or owned by someone else', async () => {
    updateCompletionForOwner.mockResolvedValue(null);

    await expect(
      service.updateCompletion(item.id, 'someone-else', { isCompleted: false }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
