import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Policy, PolicyDocument, PolicyStatus } from '../../schemas/policy.schema.js';
import { Insurer, InsurerDocument } from '../../schemas/insurer.schema.js';
import { User, UserDocument, UserRole } from '../../schemas/user.schema.js';
import { Customer, CustomerDocument } from '../../schemas/customer.schema.js';
import { Commission, CommissionDocument } from '../../schemas/commission.schema.js';
import { Instalment, InstalmentDocument, InstalmentStatus } from '../../schemas/instalment.schema.js';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Policy.name) private policyModel: Model<PolicyDocument>,
    @InjectModel(Insurer.name) private insurerModel: Model<InsurerDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Commission.name) private commissionModel: Model<CommissionDocument>,
    @InjectModel(Instalment.name) private instalmentModel: Model<InstalmentDocument>,
  ) {}

  async getDashboardSummary(companyId: string, currentUser: any) {
    const cId = new Types.ObjectId(companyId);

    // Salesman specific dashboard
    if (currentUser.role === UserRole.SALESMAN) {
      const salesmanId = currentUser._id;
      const policies = await this.policyModel.find({ companyId: cId, salesmanId });
      const now = new Date();
      const in30Days = new Date();
      in30Days.setDate(in30Days.getDate() + 30);

      const activeCount = policies.filter(p => p.status === PolicyStatus.ACTIVE || p.status === PolicyStatus.DUE_SOON).length;
      const bookedPremium = policies.reduce((acc, p) => acc + (p.premium || 0), 0);
      const renewalsDue = policies.filter(p => new Date(p.expiryDate) >= now && new Date(p.expiryDate) <= in30Days).length;

      const commRecords = await this.commissionModel.find({ companyId: cId, salesmanId });
      const earnedComm = commRecords.reduce((acc, c) => acc + (c.salesmanEarnedAmount || 0), 0);
      const paidComm = commRecords.reduce((acc, c) => acc + (c.salesmanPaidAmount || 0), 0);

      const customerIds = policies.map(p => p.customerId);
      const uniqueCustomersCount = new Set(customerIds.map(id => id.toString())).size;

      return {
        isSalesman: true,
        myActivePolicies: activeCount,
        myBookedPremium: bookedPremium,
        myRenewalsDue: renewalsDue,
        myCustomersCount: uniqueCustomersCount,
        myEarnedCommission: earnedComm,
        myPendingCommission: Math.max(0, earnedComm - paidComm),
      };
    }

    // Company Admin & Office Staff view
    const totalPolicies = await this.policyModel.countDocuments({ companyId: cId });
    const totalCustomers = await this.customerModel.countDocuments({ companyId: cId });
    const allPolicies = await this.policyModel.find({ companyId: cId });

    const totalPremium = allPolicies.reduce((acc, p) => acc + (p.premium || 0), 0);
    const activePoliciesCount = allPolicies.filter(p => p.status === PolicyStatus.ACTIVE || p.status === PolicyStatus.DUE_SOON).length;

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const renewalsDue30Days = allPolicies.filter(p => {
      const exp = new Date(p.expiryDate);
      return exp >= now && exp <= in30Days;
    }).length;

    const overdueInstalmentsCount = await this.instalmentModel.countDocuments({
      companyId: cId,
      dueDate: { $lt: now },
      status: { $ne: InstalmentStatus.PAID },
    });

    const commRecords = await this.commissionModel.find({ companyId: cId });
    const commPayableTotal = commRecords.reduce((acc, c) => acc + (c.salesmanEarnedAmount || 0), 0);

    // Business by Insurer
    const insurers = await this.insurerModel.find({ companyId: cId });
    const byInsurer = insurers.map(ins => {
      const pList = allPolicies.filter(p => p.insurerId?.toString() === ins._id.toString());
      const prem = pList.reduce((acc, p) => acc + (p.premium || 0), 0);
      return {
        id: ins._id,
        name: ins.name,
        code: ins.code,
        type: ins.type,
        policyCount: pList.length,
        premium: prem,
      };
    }).sort((a, b) => b.premium - a.premium);

    // Business by Policy Type
    const typeMap: Record<string, { count: number; premium: number }> = {};
    for (const p of allPolicies) {
      const t = p.type || 'Other';
      if (!typeMap[t]) typeMap[t] = { count: 0, premium: 0 };
      typeMap[t].count++;
      typeMap[t].premium += p.premium || 0;
    }
    const byType = Object.entries(typeMap).map(([type, data]) => ({
      type,
      ...data,
    })).sort((a, b) => b.premium - a.premium);

    // Salesman Performance
    const salesmen = await this.userModel.find({ companyId: cId, role: UserRole.SALESMAN });
    const bySalesman = salesmen.map(s => {
      const pList = allPolicies.filter(p => p.salesmanId?.toString() === s._id.toString());
      const prem = pList.reduce((acc, p) => acc + (p.premium || 0), 0);
      const sComms = commRecords.filter(c => c.salesmanId?.toString() === s._id.toString());
      const comm = sComms.reduce((acc, c) => acc + (c.salesmanEarnedAmount || 0), 0);
      return {
        id: s._id,
        name: s.name,
        code: s.salesmanCode,
        policyCount: pList.length,
        premium: prem,
        commission: comm,
      };
    }).sort((a, b) => b.premium - a.premium);

    // Recent policies
    const recentPolicies = await this.policyModel
      .find({ companyId: cId })
      .populate('customerId', 'name phone')
      .populate('insurerId', 'name code')
      .populate('salesmanId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    return {
      totalPolicies,
      activePoliciesCount,
      totalCustomers,
      totalPremium,
      renewalsDue30Days,
      overdueInstalmentsCount,
      commPayableTotal,
      byInsurer,
      byType,
      bySalesman,
      recentPolicies,
    };
  }
}
