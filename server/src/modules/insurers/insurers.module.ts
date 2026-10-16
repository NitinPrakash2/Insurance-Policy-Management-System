import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InsurersService } from './insurers.service.js';
import { InsurersController } from './insurers.controller.js';
import { Insurer, InsurerSchema } from '../../schemas/insurer.schema.js';
import { Policy, PolicySchema } from '../../schemas/policy.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Insurer.name, schema: InsurerSchema },
      { name: Policy.name, schema: PolicySchema },
    ]),
  ],
  controllers: [InsurersController],
  providers: [InsurersService],
  exports: [InsurersService],
})
export class InsurersModule {}
