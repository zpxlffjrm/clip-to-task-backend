import { IsNotEmpty, IsString } from 'class-validator';

export class CloudfrontWebHookReqDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsNotEmpty()
  bucket!: string;
}
