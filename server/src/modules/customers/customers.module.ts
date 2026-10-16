import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomersService } from './customers.service.js';
import { CustomersController } from './customers.controller.js';
import { Customer, CustomerSchema } from '../../schemas/customer.schema.js';
import { Policy, PolicySchema } from '../../schemas/policy.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: Policy.name, schema: PolicySchema },
    ]),
  ],
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService],
})
export class CustomersModule {}
