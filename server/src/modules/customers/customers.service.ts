import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerDocument } from '../../schemas/customer.schema.js';
import { Policy, PolicyDocument } from '../../schemas/policy.schema.js';
import { User, UserDocument, UserRole } from '../../schemas/user.schema.js';

import { EventsGateway } from '../../events/events.gateway.js';

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Policy.name) private policyModel: Model<PolicyDocument>,
    private eventsGateway: EventsGateway,
  ) {}

  async findAll(companyId: string, currentUser: any, search?: string) {
    const query: any = { companyId: new Types.ObjectId(companyId) };

    if (currentUser.role === UserRole.SALESMAN) {
      // Find policies assigned to this salesman
      const policies = await this.policyModel.find({
        companyId: new Types.ObjectId(companyId),
        salesmanId: currentUser._id,
      }).select('customerId');
      const customerIds = policies.map(p => p.customerId);
      query.$or = [
        { _id: { $in: customerIds } },
        { createdBy: currentUser._id },
      ];
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      const searchConditions = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { city: searchRegex },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const customers = await this.customerModel.find(query).sort({ createdAt: -1 });

    // Attach policy count
    const result = await Promise.all(
      customers.map(async (c) => {
        const policyCount = await this.policyModel.countDocuments({
          companyId: new Types.ObjectId(companyId),
          customerId: c._id,
        });
        return {
          ...c.toObject(),
          policyCount,
        };
      }),
    );

    return result;
  }

  async findOne(companyId: string, id: string) {
    const customer = await this.customerModel.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    const policies = await this.policyModel
      .find({ customerId: customer._id, companyId: new Types.ObjectId(companyId) })
      .populate('insurerId', 'name code')
      .populate('salesmanId', 'name salesmanCode');

    return { customer, policies };
  }

  async create(companyId: string, userId: string, data: Partial<Customer>) {
    // Check if phone exists in company
    const existing = await this.customerModel.findOne({
      companyId: new Types.ObjectId(companyId),
      phone: data.phone?.trim(),
    });

    const newCustomer = await this.customerModel.create({
      ...data,
      companyId: new Types.ObjectId(companyId),
      createdBy: new Types.ObjectId(userId),
    });

    // Broadcast live event over WebSocket
    this.eventsGateway.broadcastToWorkspace(companyId, 'CUSTOMER_CREATED', newCustomer);

    return {
      customer: newCustomer,
      duplicateWarning: existing ? `Note: Another customer (${existing.name}) already has phone number ${data.phone}` : null,
    };
  }

  async update(companyId: string, id: string, data: Partial<Customer>) {
    const updated = await this.customerModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) },
      data,
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Customer not found');
    }
    this.eventsGateway.broadcastToWorkspace(companyId, 'CUSTOMER_UPDATED', updated);
    return updated;
  }

  async remove(companyId: string, id: string) {
    const policyExists = await this.policyModel.findOne({
      companyId: new Types.ObjectId(companyId),
      customerId: new Types.ObjectId(id),
    });
    if (policyExists) {
      throw new Error('Customer has active policies and cannot be deleted.');
    }
    const res = await this.customerModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    });
    if (!res) {
      throw new NotFoundException('Customer not found');
    }
    return { success: true };
  }
}
