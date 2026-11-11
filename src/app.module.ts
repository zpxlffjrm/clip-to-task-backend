import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from 'src/app.controller';
import { AppService } from 'src/app.service';
import { AuthModule } from 'src/modules/auth/features/auth.module';
import { MeetingsModule } from 'src/modules/meetings/features/meetings.module';
import { UserModule } from 'src/modules/users/feastures/user.module';
import { DashboardModule } from 'src/modules/dashboard/features/dashboard.module';
import { ActionItemsModule } from 'src/modules/action-items/features/action-items.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 60,
      },
    ]),
    AuthModule,
    MeetingsModule,
    UserModule,
    DashboardModule,
    ActionItemsModule,
    MongooseModule.forRoot(process.env.MONGODB_URI as string),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
