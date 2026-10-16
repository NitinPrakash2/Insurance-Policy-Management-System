import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Insurer, InsurerDocument } from '../../schemas/insurer.schema.js';
import { Policy, PolicyDocument } from '../../schemas/policy.schema.js';

@Injectable()
export class InsurersService {
  constructor(
    @InjectModel(Insurer.name) private insurerModel: Model<InsurerDocument>,
    @InjectModel(Policy.name) private policyModel: Model<PolicyDocument>,
  ) {}

  async findAll(companyId: string) {
    const insurers = await this.insurerModel.find({ companyId: new Types.ObjectId(companyId) }).sort({ name: 1 });
    return Promise.all(
      insurers.map(async (ins) => {
        const policyCount = await this.policyModel.countDocuments({
          companyId: new Types.ObjectId(companyId),
          insurerId: ins._id,
        });
        return { ...ins.toObject(), policyCount };
      }),
    );
  }

  async create(companyId: string, data: Partial<Insurer>) {
    const existing = await this.insurerModel.findOne({
      companyId: new Types.ObjectId(companyId),
      code: data.code?.trim().toUpperCase(),
    });
    if (existing) {
      throw new ConflictException(`Insurer with code ${data.code} already exists`);
    }

    return this.insurerModel.create({
      ...data,
      code: data.code?.trim().toUpperCase(),
      companyId: new Types.ObjectId(companyId),
    });
  }

  async update(companyId: string, id: string, data: Partial<Insurer>) {
    const updated = await this.insurerModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) },
      data,
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Insurer not found');
    }
    return updated;
  }

  async toggleActive(companyId: string, id: string) {
    const ins = await this.insurerModel.findOne({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    });
    if (!ins) {
      throw new NotFoundException('Insurer not found');
    }
    ins.isActive = !ins.isActive;
    return ins.save();
  }

  async remove(companyId: string, id: string) {
    const policyCount = await this.policyModel.countDocuments({
      companyId: new Types.ObjectId(companyId),
      insurerId: new Types.ObjectId(id),
    });
    if (policyCount > 0) {
      throw new ConflictException('This insurer has policies on record and cannot be removed. Deactivate it instead.');
    }
    return this.insurerModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      companyId: new Types.ObjectId(companyId),
    });
  }
}
