import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReportsService } from './reports.service.js';
import { ReportsController } from './reports.controller.js';
import { Policy, PolicySchema } from '../../schemas/policy.schema.js';
import { Insurer, InsurerSchema } from '../../schemas/insurer.schema.js';
import { User, UserSchema } from '../../schemas/user.schema.js';
import { Customer, CustomerSchema } from '../../schemas/customer.schema.js';
import { Commission, CommissionSchema } from '../../schemas/commission.schema.js';
import { Instalment, InstalmentSchema } from '../../schemas/instalment.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Policy.name, schema: PolicySchema },
      { name: Insurer.name, schema: InsurerSchema },
      { name: User.name, schema: UserSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Commission.name, schema: CommissionSchema },
      { name: Instalment.name, schema: InstalmentSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
