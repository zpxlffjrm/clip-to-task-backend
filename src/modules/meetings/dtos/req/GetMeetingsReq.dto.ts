import { IsString } from 'class-validator';

export class GetMeetingsReqDto {
  @IsString()
  page: string = '1';

  @IsString()
  limit: string = '10';
}
