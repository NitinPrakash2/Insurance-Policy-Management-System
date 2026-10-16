import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type InsurerDocument = HydratedDocument<Insurer>;

export enum InsurerType {
  GENERAL = 'General',
  LIFE = 'Life',
  HEALTH = 'Health',
}

@Schema({ timestamps: true })
export class Insurer {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  companyId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, uppercase: true, trim: true })
  code: string;

  @Prop({ required: true, enum: InsurerType, default: InsurerType.GENERAL })
  type: InsurerType;

  @Prop({ trim: true })
  contactPerson?: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const InsurerSchema = SchemaFactory.createForClass(Insurer);
InsurerSchema.index({ companyId: 1, code: 1 }, { unique: true });
