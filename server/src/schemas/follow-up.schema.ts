import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FollowUpDocument = HydratedDocument<FollowUp>;

export enum ContactChannel {
  PHONE = 'Phone Call',
  WHATSAPP = 'WhatsApp (Manual)',
  IN_PERSON = 'In Person',
  EMAIL = 'Email',
}

export enum FollowUpResult {
  ANSWERED = 'Answered / Discussed',
  CALLBACK_REQUESTED = 'Callback Requested',
  PROMISE_TO_PAY = 'Promise to Pay',
  NOT_REACHABLE = 'Not Reachable / Busy',
  RENEWAL_CONFIRMED = 'Renewal Confirmed',
  DECLINED = 'Declined / Not Interested',
}

@Schema({ timestamps: true })
export class FollowUp {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Policy', index: true })
  policyId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  contactedBy: Types.ObjectId;

  @Prop({ required: true, enum: ContactChannel, default: ContactChannel.PHONE })
  channel: ContactChannel;

  @Prop({ required: true, enum: FollowUpResult, default: FollowUpResult.ANSWERED })
  result: FollowUpResult;

  @Prop({ required: true, trim: true })
  notes: string;

  @Prop()
  nextFollowUpDate?: Date;
}

export const FollowUpSchema = SchemaFactory.createForClass(FollowUp);
FollowUpSchema.index({ companyId: 1, nextFollowUpDate: 1 });
