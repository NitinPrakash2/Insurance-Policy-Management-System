import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  OFFICE_STAFF = 'OFFICE_STAFF',
  SALESMAN = 'SALESMAN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ type: Types.ObjectId, ref: 'Company', default: null, index: true })
  companyId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop({ default: UserStatus.ACTIVE, enum: UserStatus })
  status: UserStatus;

  @Prop()
  phone?: string;

  @Prop({ trim: true })
  salesmanCode?: string;

  @Prop({ default: 0 })
  defaultCommissionRate?: number;

  @Prop({ type: [String], default: [] })
  permissions: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ companyId: 1, role: 1 });
