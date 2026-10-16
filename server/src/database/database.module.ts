import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from './seed.service.js';
import { User, UserSchema } from '../schemas/user.schema.js';
import { Company, CompanySchema } from '../schemas/company.schema.js';
import { Insurer, InsurerSchema } from '../schemas/insurer.schema.js';
import { Customer, CustomerSchema } from '../schemas/customer.schema.js';
import { Policy, PolicySchema } from '../schemas/policy.schema.js';
import { Instalment, InstalmentSchema } from '../schemas/instalment.schema.js';
import { Commission, CommissionSchema } from '../schemas/commission.schema.js';
import { FollowUp, FollowUpSchema } from '../schemas/follow-up.schema.js';
import { AuditLog, AuditLogSchema } from '../schemas/audit-log.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Insurer.name, schema: InsurerSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: Policy.name, schema: PolicySchema },
      { name: Instalment.name, schema: InstalmentSchema },
      { name: Commission.name, schema: CommissionSchema },
      { name: FollowUp.name, schema: FollowUpSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  providers: [SeedService],
  exports: [MongooseModule, SeedService],
})
export class DatabaseModule {}
