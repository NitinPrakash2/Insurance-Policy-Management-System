import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument } from '../../schemas/audit-log.schema.js';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async findAll() {
    return this.auditLogModel
      .find()
      .populate('actorId', 'name email role')
      .populate('companyId', 'name slug')
      .sort({ createdAt: -1 })
      .limit(50);
  }

  async log(data: any) {
    return this.auditLogModel.create(data);
  }
}
