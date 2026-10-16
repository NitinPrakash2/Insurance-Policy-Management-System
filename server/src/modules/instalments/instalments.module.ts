import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InstalmentsService } from './instalments.service.js';
import { InstalmentsController } from './instalments.controller.js';
import { Instalment, InstalmentSchema } from '../../schemas/instalment.schema.js';
import { Policy, PolicySchema } from '../../schemas/policy.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Instalment.name, schema: InstalmentSchema },
      { name: Policy.name, schema: PolicySchema },
    ]),
  ],
  controllers: [InstalmentsController],
  providers: [InstalmentsService],
  exports: [InstalmentsService],
})
export class InstalmentsModule {}
