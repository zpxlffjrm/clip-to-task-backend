import { IsString } from 'class-validator';

export class SignInReqDto {
  @IsString()
  name!: string;

  @IsString()
  password!: string;
}
