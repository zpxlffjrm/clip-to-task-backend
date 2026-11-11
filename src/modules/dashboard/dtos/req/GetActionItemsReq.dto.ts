import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class GetActionItemsReqDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsNumber()
  page: number = 1;

  @IsNumber()
  limit: number = 3;
}
