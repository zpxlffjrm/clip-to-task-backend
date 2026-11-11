import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { StorageService } from 'src/modules/R2/r2.service';
import { S3_CLIENT, S3ClientProvider } from 'src/modules/R2/r2.provider';

@Module({
  imports: [ConfigModule],
  providers: [S3ClientProvider, StorageService],
  exports: [S3_CLIENT, StorageService], // 다른 모듈에서 쓰려면 export 필수
})
export class R2Module {}
