import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Commission, CommissionDocument, CommissionStatus } from '../../schemas/commission.schema.js';
import { User, UserDocument, UserRole } from '../../schemas/user.schema.js';
import { Policy, PolicyDocument } from '../../schemas/policy.schema.js';

@Injectable()
export class CommissionsService {
  constructor(
    @InjectModel(Commission.name) private commissionModel: Model<CommissionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Policy.name) private policyModel: Model<PolicyDocument>,
  ) {}

  async getSummary(companyId: string, currentUser: any) {
    if (currentUser.role === UserRole.SALESMAN) {
      const records = await this.commissionModel.find({
        companyId: new Types.ObjectId(companyId),
        salesmanId: currentUser._id,
      });

      const totalEarned = records.reduce((acc, r) => acc + (r.salesmanEarnedAmount || 0), 0);
      const totalPaid = records.reduce((acc, r) => acc + (r.salesmanPaidAmount || 0), 0);

      return {
        isSalesmanView: true,
        totalEarned,
        totalPaid,
        balancePayable: Math.max(0, totalEarned - totalPaid),
      };
    }

    // Company Admin view
    const records = await this.commissionModel.find({ companyId: new Types.ObjectId(companyId) });

    const totalInsurerExpected = records.reduce((acc, r) => acc + (r.insurerExpectedAmount || 0), 0);
    const totalInsurerReceived = records.reduce((acc, r) => acc + (r.insurerReceivedAmount || 0), 0);
    const totalSalesmanEarned = records.reduce((acc, r) => acc + (r.salesmanEarnedAmount || 0), 0);
    const totalSalesmanPaid = records.reduce((acc, r) => acc + (r.salesmanPaidAmount || 0), 0);

    const netBrokerageYield = totalInsurerExpected - totalSalesmanEarned;

    // Breakdown by Salesman
    const salesmen = await this.userModel.find({
      companyId: new Types.ObjectId(companyId),
      role: UserRole.SALESMAN,
    });

    const bySalesman = salesmen.map((s) => {
      const sRecords = records.filter(r => r.salesmanId?.toString() === s._id.toString());
      const earned = sRecords.reduce((acc, r) => acc + (r.salesmanEarnedAmount || 0), 0);
      const paid = sRecords.reduce((acc, r) => acc + (r.salesmanPaidAmount || 0), 0);
      return {
        id: s._id,
        name: s.name,
        code: s.salesmanCode,
        policyCount: sRecords.length,
        earned,
        paid,
        balance: Math.max(0, earned - paid),
      };
    });

    return {
      totalInsurerExpected,
      totalInsurerReceived,
      insurerPending: Math.max(0, totalInsurerExpected - totalInsurerReceived),
      totalSalesmanEarned,
      totalSalesmanPaid,
      salesmanPending: Math.max(0, totalSalesmanEarned - totalSalesmanPaid),
      netBrokerageYield,
      bySalesman,
    };
  }

  async findAll(companyId: string, currentUser: any, salesmanId?: string) {
    const query: any = { companyId: new Types.ObjectId(companyId) };

    if (currentUser.role === UserRole.SALESMAN) {
      query.salesmanId = currentUser._id;
    } else if (salesmanId) {
      query.salesmanId = new Types.ObjectId(salesmanId);
    }

    const records = await this.commissionModel
      .find(query)
      .populate({
        path: 'policyId',
        select: 'policyNumber type premium expiryDate vehicleNumber customerId insurerId',
        populate: [
          { path: 'customerId', select: 'name phone' },
          { path: 'insurerId', select: 'name code' },
        ],
      })
      .populate('salesmanId', 'name salesmanCode')
      .sort({ createdAt: -1 });

    if (currentUser.role === UserRole.SALESMAN) {
      return records.map((r) => {
        const obj: any = r.toObject();
        delete obj.insurerCommissionRate;
        delete obj.insurerExpectedAmount;
        delete obj.insurerReceivedAmount;
        delete obj.insurerReceivedDate;
        delete obj.insurerReference;
        return obj;
      });
    }


    return records;
  }

  async recordSalesmanPayout(
    companyId: string,
    id: string,
    data: { amount: number; paymentDate?: Date; reference?: string; notes?: string },
  ) {
    const commission = await this.commissionModel.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    });
    if (!commission) {
      throw new NotFoundException('Commission record not found');
    }

    commission.salesmanPaidAmount = (commission.salesmanPaidAmount || 0) + Number(data.amount);
    commission.salesmanPaidDate = data.paymentDate ? new Date(data.paymentDate) : new Date();
    commission.salesmanReference = data.reference;
    if (data.notes) commission.notes = data.notes;

    if (commission.salesmanPaidAmount >= commission.salesmanEarnedAmount) {
      commission.status = CommissionStatus.SETTLED;
    } else if (commission.salesmanPaidAmount > 0) {
      commission.status = CommissionStatus.PARTIAL;
    }

    return commission.save();
  }

  async recordInsurerReceipt(
    companyId: string,
    id: string,
    data: { amount: number; receivedDate?: Date; reference?: string },
  ) {
    const commission = await this.commissionModel.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    });
    if (!commission) {
      throw new NotFoundException('Commission record not found');
    }

    commission.insurerReceivedAmount = (commission.insurerReceivedAmount || 0) + Number(data.amount);
    commission.insurerReceivedDate = data.receivedDate ? new Date(data.receivedDate) : new Date();
    commission.insurerReference = data.reference;

    return commission.save();
  }
}
