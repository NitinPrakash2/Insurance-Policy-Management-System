import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PoliciesService } from './policies.service.js';
import { PoliciesController } from './policies.controller.js';
import { Policy, PolicySchema } from '../../schemas/policy.schema.js';
import { Customer, CustomerSchema } from '../../schemas/customer.schema.js';
import { Insurer, InsurerSchema } from '../../schemas/insurer.schema.js';
import { User, UserSchema } from '../../schemas/user.schema.js';
import { Instalment, InstalmentSchema } from '../../schemas/instalment.schema.js';
import { Commission, CommissionSchema } from '../../schemas/commission.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Policy.name, schema: PolicySchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Insurer.name, schema: InsurerSchema },
      { name: User.name, schema: UserSchema },
      { name: Instalment.name, schema: InstalmentSchema },
      { name: Commission.name, schema: CommissionSchema },
    ]),
  ],
  controllers: [PoliciesController],
  providers: [PoliciesService],
  exports: [PoliciesService],
})
export class PoliciesModule {}
