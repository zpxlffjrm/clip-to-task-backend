import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRecordReqDto {
  /**
   * @deprecated 무시된다. 사용자는 항상 액세스 토큰에서 가져온다.
   * 기존 앱 버전이 계속 보내므로 요청이 거부되지 않도록 허용만 해 둔다.
   */
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  fileType!: string;
}
