import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommissionDocument = HydratedDocument<Commission>;

export enum CommissionStatus {
  UNPAID = 'Unpaid',
  PARTIAL = 'Partial',
  SETTLED = 'Settled',
}

@Schema({ timestamps: true })
export class Commission {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Policy', required: true, unique: true, index: true })
  policyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  salesmanId: Types.ObjectId;

  @Prop({ default: 0 })
  insurerCommissionRate: number;

  @Prop({ default: 0 })
  insurerExpectedAmount: number;

  @Prop({ default: 0 })
  insurerReceivedAmount: number;

  @Prop()
  insurerReceivedDate?: Date;

  @Prop({ trim: true })
  insurerReference?: string;

  @Prop({ default: 0 })
  salesmanCommissionRate: number;

  @Prop({ default: 0 })
  salesmanEarnedAmount: number;

  @Prop({ default: 0 })
  salesmanPaidAmount: number;

  @Prop()
  salesmanPaidDate?: Date;

  @Prop({ trim: true })
  salesmanReference?: string;

  @Prop({ default: CommissionStatus.UNPAID, enum: CommissionStatus })
  status: CommissionStatus;

  @Prop({ trim: true })
  notes?: string;
}

export const CommissionSchema = SchemaFactory.createForClass(Commission);
CommissionSchema.index({ companyId: 1, salesmanId: 1 });
