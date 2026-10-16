import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FollowUp, FollowUpSchema } from '../../schemas/follow-up.schema.js';
import { FollowupsController } from './followups.controller.js';
import { FollowupsService } from './followups.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: FollowUp.name, schema: FollowUpSchema }]),
  ],
  controllers: [FollowupsController],
  providers: [FollowupsService],
  exports: [FollowupsService],
})
export class FollowupsModule {}
