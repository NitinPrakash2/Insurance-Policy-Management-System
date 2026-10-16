import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EmployeesService } from './employees.service.js';
import { EmployeesController } from './employees.controller.js';
import { User, UserSchema } from '../../schemas/user.schema.js';
import { Company, CompanySchema } from '../../schemas/company.schema.js';
import { Policy, PolicySchema } from '../../schemas/policy.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Policy.name, schema: PolicySchema },
    ]),
  ],
  controllers: [EmployeesController],
  providers: [EmployeesService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
