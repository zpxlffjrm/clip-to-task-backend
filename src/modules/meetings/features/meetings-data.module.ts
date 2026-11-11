import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MeetingsRepository } from 'src/modules/meetings/features/meetings.repository';
import {
  MeetingData,
  MeetingDataSchema,
} from 'src/modules/meetings/schemas/meeting-data.schema';
import { PrismaModule } from 'src/modules/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    MongooseModule.forFeature([
      { name: MeetingData.name, schema: MeetingDataSchema },
    ]),
  ],
  providers: [MeetingsRepository],
  exports: [MongooseModule, MeetingsRepository],
})
export class MeetingsDataModule {}
