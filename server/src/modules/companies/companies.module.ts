import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompaniesService } from './companies.service.js';
import { CompaniesController } from './companies.controller.js';
import { Company, CompanySchema } from '../../schemas/company.schema.js';
import { User, UserSchema } from '../../schemas/user.schema.js';
import { AuditLog, AuditLogSchema } from '../../schemas/audit-log.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: User.name, schema: UserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
    ]),
  ],
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
