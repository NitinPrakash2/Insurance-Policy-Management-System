import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InstalmentDocument = HydratedDocument<Instalment>;

export enum InstalmentStatus {
  PENDING = 'Pending',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
}

export enum PaymentMode {
  DIRECT_TO_INSURER = 'Direct to Insurer',
  BROKER_RECEIPT = 'Broker Receipt',
  ONLINE = 'Online / UPI',
  CHEQUE = 'Cheque',
  CASH = 'Cash',
}

@Schema({ timestamps: true })
export class Instalment {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Policy', required: true, index: true })
  policyId: Types.ObjectId;

  @Prop({ required: true, default: 1 })
  instalmentNumber: number;

  @Prop({ required: true, default: 1 })
  totalInstalments: number;

  @Prop({ required: true, index: true })
  dueDate: Date;

  @Prop()
  graceEndDate?: Date;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ default: InstalmentStatus.PENDING, enum: InstalmentStatus })
  status: InstalmentStatus;

  @Prop({ enum: PaymentMode })
  paymentMode?: PaymentMode;

  @Prop()
  paidDate?: Date;

  @Prop({ trim: true })
  transactionReference?: string;

  @Prop({ trim: true })
  notes?: string;
}

export const InstalmentSchema = SchemaFactory.createForClass(Instalment);
InstalmentSchema.index({ companyId: 1, dueDate: 1, status: 1 });
