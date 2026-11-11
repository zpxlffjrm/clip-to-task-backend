import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserDeviceTokenDto {
  @IsString()
  @IsNotEmpty()
  deviceToken!: string;

  @IsString()
  @IsNotEmpty()
  id!: string;
}
