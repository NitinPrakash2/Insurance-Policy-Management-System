import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole, UserStatus } from '../../schemas/user.schema.js';
import { Company, CompanyDocument } from '../../schemas/company.schema.js';
import { Policy, PolicyDocument } from '../../schemas/policy.schema.js';
import { EventsGateway } from '../../events/events.gateway.js';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Policy.name) private policyModel: Model<PolicyDocument>,
    private eventsGateway: EventsGateway,
  ) {}

  async findAll(companyId: string) {
    const employees = await this.userModel
      .find({
        companyId: new Types.ObjectId(companyId),
        role: { $in: [UserRole.OFFICE_STAFF, UserRole.SALESMAN] },
      })
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    const company = await this.companyModel.findById(companyId);
    const activeCount = employees.filter(e => e.status === UserStatus.ACTIVE).length;
    const maxSlots = company?.maxSlots || 10;

    // Attach policy count for salesmen
    const result = await Promise.all(
      employees.map(async (emp) => {
        let policyCount = 0;
        if (emp.role === UserRole.SALESMAN) {
          policyCount = await this.policyModel.countDocuments({
            companyId: new Types.ObjectId(companyId),
            salesmanId: emp._id,
          });
        }
        return {
          ...emp.toObject(),
          policyCount,
        };
      }),
    );

    return {
      employees: result,
      slotUsage: {
        used: activeCount,
        max: maxSlots,
        available: Math.max(0, maxSlots - activeCount),
      },
    };
  }

  async create(companyId: string, data: any) {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const activeCount = await this.userModel.countDocuments({
      companyId: new Types.ObjectId(companyId),
      role: { $in: [UserRole.OFFICE_STAFF, UserRole.SALESMAN] },
      status: UserStatus.ACTIVE,
    });

    if (activeCount >= company.maxSlots) {
      throw new ConflictException(
        `Slot capacity exceeded! Current active employees: ${activeCount} / Max slots: ${company.maxSlots}. Please contact Platform Super Admin to increase capacity.`,
      );
    }

    const existing = await this.userModel.findOne({ email: data.email.toLowerCase().trim() });
    if (existing) {
      throw new ConflictException(`User with email ${data.email} already exists`);
    }

    const passwordHash = await bcrypt.hash(data.password || 'Employee@123', 10);

    const employee = await this.userModel.create({
      companyId: new Types.ObjectId(companyId),
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash,
      role: data.role,
      phone: data.phone?.trim(),
      salesmanCode: data.salesmanCode?.trim()?.toUpperCase(),
      defaultCommissionRate: Number(data.defaultCommissionRate) || 0,
      status: UserStatus.ACTIVE,
      permissions: data.permissions || [],
    });

    const result = {
      _id: employee._id.toString(),
      id: employee._id.toString(),
      name: employee.name,
      email: employee.email,
      role: employee.role,
      phone: employee.phone,
      status: employee.status,
      salesmanCode: employee.salesmanCode,
      defaultCommissionRate: employee.defaultCommissionRate,
    };

    this.eventsGateway.broadcastToWorkspace(companyId, 'EMPLOYEE_CREATED', result);
    return result;
  }

  async update(companyId: string, id: string, data: any) {
    const employee = await this.userModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) },
      data,
      { new: true },
    ).select('-passwordHash');

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  async toggleStatus(companyId: string, id: string) {
    const employee = await this.userModel.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    if (employee.status === UserStatus.ACTIVE) {
      employee.status = UserStatus.INACTIVE;
    } else {
      // Check slot quota before activating
      const company = await this.companyModel.findById(companyId);
      const activeCount = await this.userModel.countDocuments({
        companyId: new Types.ObjectId(companyId),
        role: { $in: [UserRole.OFFICE_STAFF, UserRole.SALESMAN] },
        status: UserStatus.ACTIVE,
      });
      if (activeCount >= (company?.maxSlots || 10)) {
        throw new ConflictException('Cannot reactivate: all employee slots are currently in use.');
      }
      employee.status = UserStatus.ACTIVE;
    }

    await employee.save();
    const result = { _id: employee._id.toString(), id: employee._id.toString(), status: employee.status };
    this.eventsGateway.broadcastToWorkspace(companyId, 'EMPLOYEE_UPDATED', result);
    return result;
  }
}
