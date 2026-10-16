import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ type: Types.ObjectId, ref: 'Company', default: null, index: true })
  companyId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  actorId?: Types.ObjectId;

  @Prop({ required: true })
  actorRole: string;

  @Prop({ required: true, trim: true })
  action: string;

  @Prop({ required: true, trim: true })
  entity: string;

  @Prop({ trim: true })
  entityId?: string;

  @Prop({ type: Object, default: {} })
  details?: Record<string, any>;

  @Prop()
  ipAddress?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
AuditLogSchema.index({ companyId: 1, createdAt: -1 });
