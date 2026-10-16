import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PolicyDocument = HydratedDocument<Policy>;

export enum PolicyStatus {
  ACTIVE = 'Active',
  DUE_SOON = 'Due Soon',
  OVERDUE = 'Overdue',
  EXPIRED = 'Expired',
  LAPSED = 'Lapsed',
  CANCELLED = 'Cancelled',
}

export enum PaymentFrequency {
  YEARLY = 'Yearly',
  HALF_YEARLY = 'Half-Yearly',
  QUARTERLY = 'Quarterly',
  MONTHLY = 'Monthly',
  SINGLE = 'Single',
  CUSTOM = 'Custom',
}

@Schema({ timestamps: true })
export class Policy {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  policyNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Insurer', required: true, index: true })
  insurerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  salesmanId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  type: string;

  @Prop({ default: 0 })
  sumInsured: number;

  @Prop({ required: true, min: 0 })
  premium: number;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true, index: true })
  expiryDate: Date;

  @Prop({ required: true, enum: PaymentFrequency, default: PaymentFrequency.YEARLY })
  paymentFrequency: PaymentFrequency;

  @Prop({ default: PolicyStatus.ACTIVE, enum: PolicyStatus })
  status: PolicyStatus;

  @Prop({ trim: true, uppercase: true })
  vehicleNumber?: string;

  @Prop({ default: false })
  hasDocument: boolean;

  @Prop()
  documentFileName?: string;

  @Prop({ type: Types.ObjectId, ref: 'Policy', default: null })
  renewedFromPolicyId?: Types.ObjectId;
}

export const PolicySchema = SchemaFactory.createForClass(Policy);
PolicySchema.index({ companyId: 1, policyNumber: 1 });
PolicySchema.index({ companyId: 1, expiryDate: 1 });
PolicySchema.index({ companyId: 1, vehicleNumber: 1 });
