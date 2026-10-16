import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type CompanyDocument = HydratedDocument<Company>;

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
}

@Schema({ timestamps: true })
export class Company {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ default: CompanyStatus.ACTIVE, enum: CompanyStatus })
  status: CompanyStatus;

  @Prop({ default: 10, min: 1 })
  maxSlots: number;

  @Prop()
  address?: string;

  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop({ type: Object, default: {} })
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
  };
}

export const CompanySchema = SchemaFactory.createForClass(Company);
