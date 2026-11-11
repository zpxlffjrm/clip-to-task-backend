import { IsNotEmpty, IsString } from 'class-validator';

export class GetMeetingReqDto {
  @IsString()
  @IsNotEmpty()
  id!: string;
}
