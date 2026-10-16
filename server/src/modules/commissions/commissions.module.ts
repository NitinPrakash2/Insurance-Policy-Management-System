import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommissionsService } from './commissions.service.js';
import { CommissionsController } from './commissions.controller.js';
import { Commission, CommissionSchema } from '../../schemas/commission.schema.js';
import { User, UserSchema } from '../../schemas/user.schema.js';
import { Policy, PolicySchema } from '../../schemas/policy.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Commission.name, schema: CommissionSchema },
      { name: User.name, schema: UserSchema },
      { name: Policy.name, schema: PolicySchema },
    ]),
  ],
  controllers: [CommissionsController],
  providers: [CommissionsService],
  exports: [CommissionsService],
})
export class CommissionsModule {}
