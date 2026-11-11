import { IsBoolean } from 'class-validator';

export class UpdateActionItemCompletionReqDto {
  @IsBoolean()
  isCompleted!: boolean;
}
