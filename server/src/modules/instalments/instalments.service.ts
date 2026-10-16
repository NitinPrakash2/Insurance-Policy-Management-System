import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Instalment, InstalmentDocument, InstalmentStatus, PaymentMode } from '../../schemas/instalment.schema.js';
import { Policy, PolicyDocument } from '../../schemas/policy.schema.js';
import { UserRole } from '../../schemas/user.schema.js';

@Injectable()
export class InstalmentsService {
  constructor(
    @InjectModel(Instalment.name) private instalmentModel: Model<InstalmentDocument>,
    @InjectModel(Policy.name) private policyModel: Model<PolicyDocument>,
  ) {}

  async findAll(companyId: string, currentUser: any, filters?: { status?: string; window?: string }) {
    const query: any = { companyId: new Types.ObjectId(companyId) };

    if (filters?.status && filters.status !== 'All') {
      query.status = filters.status;
    }

    const now = new Date();
    if (filters?.window === 'today') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.setHours(23, 59, 59, 999));
      query.dueDate = { $gte: startOfDay, $lte: endOfDay };
    } else if (filters?.window === '7days') {
      const next7 = new Date();
      next7.setDate(next7.getDate() + 7);
      query.dueDate = { $gte: new Date(), $lte: next7 };
    } else if (filters?.window === '30days') {
      const next30 = new Date();
      next30.setDate(next30.getDate() + 30);
      query.dueDate = { $gte: new Date(), $lte: next30 };
    } else if (filters?.window === 'overdue') {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: InstalmentStatus.PAID };
    }

    // If salesman, filter by assigned policies
    if (currentUser.role === UserRole.SALESMAN) {
      const policies = await this.policyModel.find({
        companyId: new Types.ObjectId(companyId),
        salesmanId: currentUser._id,
      }).select('_id');
      query.policyId = { $in: policies.map(p => p._id) };
    }

    return this.instalmentModel
      .find(query)
      .populate({
        path: 'policyId',
        select: 'policyNumber type premium expiryDate vehicleNumber customerId insurerId',
        populate: [
          { path: 'customerId', select: 'name phone' },
          { path: 'insurerId', select: 'name code' },
        ],
      })
      .sort({ dueDate: 1 });
  }

  async markPaid(companyId: string, id: string, data: { paidDate?: Date; paymentMode: PaymentMode; transactionReference?: string; notes?: string }) {
    const instalment = await this.instalmentModel.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    });

    if (!instalment) {
      throw new NotFoundException('Instalment not found');
    }

    instalment.status = InstalmentStatus.PAID;
    instalment.paidDate = data.paidDate ? new Date(data.paidDate) : new Date();
    instalment.paymentMode = data.paymentMode;
    instalment.transactionReference = data.transactionReference?.trim();
    instalment.notes = data.notes?.trim();

    return instalment.save();
  }
}
