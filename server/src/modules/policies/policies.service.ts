import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Policy, PolicyDocument, PolicyStatus, PaymentFrequency } from '../../schemas/policy.schema.js';
import { Customer, CustomerDocument } from '../../schemas/customer.schema.js';
import { Insurer, InsurerDocument } from '../../schemas/insurer.schema.js';
import { User, UserDocument, UserRole } from '../../schemas/user.schema.js';
import { Instalment, InstalmentDocument, InstalmentStatus } from '../../schemas/instalment.schema.js';
import { Commission, CommissionDocument, CommissionStatus } from '../../schemas/commission.schema.js';

import { EventsGateway } from '../../events/events.gateway.js';

@Injectable()
export class PoliciesService {
  constructor(
    @InjectModel(Policy.name) private policyModel: Model<PolicyDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Insurer.name) private insurerModel: Model<InsurerDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Instalment.name) private instalmentModel: Model<InstalmentDocument>,
    @InjectModel(Commission.name) private commissionModel: Model<CommissionDocument>,
    private eventsGateway: EventsGateway,
  ) {}

  async findAll(companyId: string, currentUser: any, filters?: { search?: string; insurerId?: string; status?: string; salesmanId?: string }) {
    const query: any = { companyId: new Types.ObjectId(companyId) };

    if (currentUser.role === UserRole.SALESMAN) {
      query.salesmanId = currentUser._id;
    } else if (filters?.salesmanId) {
      query.salesmanId = new Types.ObjectId(filters.salesmanId);
    }

    if (filters?.insurerId) {
      query.insurerId = new Types.ObjectId(filters.insurerId);
    }

    if (filters?.status && filters.status !== 'All') {
      query.status = filters.status;
    }

    if (filters?.search) {
      const searchRegex = { $regex: filters.search, $options: 'i' };
      // Search matching customers first
      const matchedCustomers = await this.customerModel.find({
        companyId: new Types.ObjectId(companyId),
        $or: [{ name: searchRegex }, { phone: searchRegex }],
      }).select('_id');
      const matchedCustomerIds = matchedCustomers.map(c => c._id);

      query.$or = [
        { policyNumber: searchRegex },
        { vehicleNumber: searchRegex },
        { type: searchRegex },
        { customerId: { $in: matchedCustomerIds } },
      ];
    }

    const policies = await this.policyModel
      .find(query)
      .populate('customerId', 'name phone email city')
      .populate('insurerId', 'name code type')
      .populate('salesmanId', 'name salesmanCode defaultCommissionRate')
      .sort({ createdAt: -1 });

    const now = new Date();

    return policies.map((p) => {
      const obj = p.toObject();
      const expiry = new Date(p.expiryDate);
      const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      let computedStatus = p.status;
      if (p.status !== PolicyStatus.CANCELLED && p.status !== PolicyStatus.LAPSED) {
        if (diffDays < 0) computedStatus = PolicyStatus.EXPIRED;
        else if (diffDays <= 30) computedStatus = PolicyStatus.DUE_SOON;
        else computedStatus = PolicyStatus.ACTIVE;
      }

      return {
        ...obj,
        daysRemaining: diffDays,
        computedStatus,
      };
    });
  }

  async findOne(companyId: string, currentUser: any, id: string) {
    const policy = await this.policyModel
      .findOne({ _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) })
      .populate('customerId')
      .populate('insurerId')
      .populate('salesmanId', 'name email phone salesmanCode defaultCommissionRate');

    if (!policy) {
      throw new NotFoundException('Policy not found');
    }

    // Role check for salesman
    if (currentUser.role === UserRole.SALESMAN && policy.salesmanId?._id?.toString() !== currentUser._id.toString()) {
      throw new NotFoundException('Policy not found or access denied');
    }

    const instalments = await this.instalmentModel
      .find({ policyId: policy._id, companyId: new Types.ObjectId(companyId) })
      .sort({ instalmentNumber: 1 });

    let commission: any = null;
    const commRecord = await this.commissionModel.findOne({
      policyId: policy._id,
      companyId: new Types.ObjectId(companyId),
    });

    if (commRecord) {
      const commObj: any = commRecord.toObject();
      // Mask insurer commission from salesman
      if (currentUser.role === UserRole.SALESMAN) {
        delete commObj.insurerCommissionRate;
        delete commObj.insurerExpectedAmount;
        delete commObj.insurerReceivedAmount;
        delete commObj.insurerReceivedDate;
        delete commObj.insurerReference;
      }
      commission = commObj;
    }


    return { policy, instalments, commission };
  }

  async create(companyId: string, data: any) {
    const existing = await this.policyModel.findOne({
      companyId: new Types.ObjectId(companyId),
      policyNumber: data.policyNumber.trim(),
    });
    if (existing) {
      throw new ConflictException(`Policy number ${data.policyNumber} already exists in your company`);
    }

    const policy = await this.policyModel.create({
      companyId: new Types.ObjectId(companyId),
      policyNumber: data.policyNumber.trim(),
      customerId: new Types.ObjectId(data.customerId),
      insurerId: new Types.ObjectId(data.insurerId),
      salesmanId: new Types.ObjectId(data.salesmanId),
      type: data.type,
      sumInsured: Number(data.sumInsured) || 0,
      premium: Number(data.premium) || 0,
      startDate: new Date(data.startDate),
      expiryDate: new Date(data.expiryDate),
      paymentFrequency: data.paymentFrequency || PaymentFrequency.YEARLY,
      vehicleNumber: data.vehicleNumber?.trim()?.toUpperCase(),
      status: PolicyStatus.ACTIVE,
    });

    // 1. Generate Instalment Schedules
    await this.generateInstalments(companyId, policy);

    // 2. Generate Commission Record
    const salesman = await this.userModel.findById(data.salesmanId);
    const salesmanRate = Number(data.salesmanCommissionRate) || (salesman?.defaultCommissionRate ?? 8);
    const insurerRate = Number(data.insurerCommissionRate) || 15;

    const premium = Number(policy.premium) || 0;
    const salesmanEarned = Math.round((premium * salesmanRate) / 100);
    const insurerExpected = Math.round((premium * insurerRate) / 100);

    await this.commissionModel.create({
      companyId: new Types.ObjectId(companyId),
      policyId: policy._id,
      salesmanId: policy.salesmanId,
      insurerCommissionRate: insurerRate,
      insurerExpectedAmount: insurerExpected,
      salesmanCommissionRate: salesmanRate,
      salesmanEarnedAmount: salesmanEarned,
      status: CommissionStatus.UNPAID,
    });

    const populated = await policy.populate([
      { path: 'customerId', select: 'name phone email city' },
      { path: 'insurerId', select: 'name code type' },
      { path: 'salesmanId', select: 'name salesmanCode' },
    ]);

    this.eventsGateway.broadcastToWorkspace(companyId, 'POLICY_CREATED', populated);

    return populated;
  }

  private async generateInstalments(companyId: string, policy: any) {
    const premium = policy.premium;
    const startDate = new Date(policy.startDate);
    let intervals = 1;
    let monthStep = 12;

    switch (policy.paymentFrequency) {
      case PaymentFrequency.HALF_YEARLY:
        intervals = 2;
        monthStep = 6;
        break;
      case PaymentFrequency.QUARTERLY:
        intervals = 4;
        monthStep = 3;
        break;
      case PaymentFrequency.MONTHLY:
        intervals = 12;
        monthStep = 1;
        break;
      case PaymentFrequency.YEARLY:
      default:
        intervals = 1;
        monthStep = 12;
        break;
    }

    const perInstalmentAmount = Math.round(premium / intervals);
    const instalmentsToCreate: any[] = [];

    for (let i = 0; i < intervals; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i * monthStep);

      const graceDate = new Date(dueDate);
      graceDate.setDate(graceDate.getDate() + 30); // 30 days standard grace

      instalmentsToCreate.push({
        companyId: new Types.ObjectId(companyId),
        policyId: policy._id,
        instalmentNumber: i + 1,
        totalInstalments: intervals,
        dueDate,
        graceEndDate: graceDate,
        amount: perInstalmentAmount,
        status: i === 0 ? InstalmentStatus.PAID : InstalmentStatus.PENDING,
        paidDate: i === 0 ? new Date() : undefined,
        paymentMode: i === 0 ? 'Direct to Insurer' : undefined,
      });
    }

    await this.instalmentModel.insertMany(instalmentsToCreate);
  }

  async update(companyId: string, id: string, data: any) {
    const updated = await this.policyModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) },
      data,
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Policy not found');
    }
    return updated;
  }

  async rolloverRenewal(companyId: string, oldPolicyId: string, data: any) {
    const oldPolicy = await this.policyModel.findOne({
      _id: new Types.ObjectId(oldPolicyId),
      companyId: new Types.ObjectId(companyId),
    });
    if (!oldPolicy) {
      throw new NotFoundException('Original policy not found');
    }

    const newPolicy = await this.policyModel.create({
      companyId: new Types.ObjectId(companyId),
      policyNumber: data.newPolicyNumber.trim(),
      customerId: oldPolicy.customerId,
      insurerId: data.insurerId ? new Types.ObjectId(data.insurerId) : oldPolicy.insurerId,
      salesmanId: data.salesmanId ? new Types.ObjectId(data.salesmanId) : oldPolicy.salesmanId,
      type: oldPolicy.type,
      sumInsured: Number(data.sumInsured) || oldPolicy.sumInsured,
      premium: Number(data.premium) || oldPolicy.premium,
      startDate: new Date(data.startDate),
      expiryDate: new Date(data.expiryDate),
      paymentFrequency: data.paymentFrequency || oldPolicy.paymentFrequency,
      vehicleNumber: oldPolicy.vehicleNumber,
      status: PolicyStatus.ACTIVE,
      renewedFromPolicyId: oldPolicy._id,
    });

    await this.generateInstalments(companyId, newPolicy);

    oldPolicy.status = PolicyStatus.EXPIRED;
    await oldPolicy.save();

    return newPolicy;
  }

  async remove(companyId: string, id: string) {
    const res = await this.policyModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    });
    if (!res) {
      throw new NotFoundException('Policy not found');
    }
    await this.instalmentModel.deleteMany({ policyId: new Types.ObjectId(id) });
    await this.commissionModel.deleteMany({ policyId: new Types.ObjectId(id) });
    return { success: true };
  }
}
