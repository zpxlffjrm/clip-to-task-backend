import { IsString, IsUUID } from 'class-validator';

export class SaveTokenDto {
  @IsUUID()
  userId!: string;

  @IsString()
  accessToken!: string;

  @IsString()
  refreshToken!: string;
}
