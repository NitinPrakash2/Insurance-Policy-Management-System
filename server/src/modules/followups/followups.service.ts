import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FollowUp, FollowUpDocument, FollowUpResult, ContactChannel } from '../../schemas/follow-up.schema.js';
import { EventsGateway } from '../../events/events.gateway.js';

@Injectable()
export class FollowupsService {
  constructor(
    @InjectModel(FollowUp.name) private followUpModel: Model<FollowUpDocument>,
    private eventsGateway: EventsGateway,
  ) {}

  async findAll(companyId: string) {
    const list = await this.followUpModel
      .find({ companyId: new Types.ObjectId(companyId) })
      .populate('customerId', 'name phone email city')
      .populate('policyId', 'policyNumber type premium')
      .populate('contactedBy', 'name role')
      .sort({ createdAt: -1 });
    return list;
  }

  async create(companyId: string, userId: string, data: any) {
    const created = await this.followUpModel.create({
      companyId: new Types.ObjectId(companyId),
      customerId: new Types.ObjectId(data.customerId),
      policyId: data.policyId ? new Types.ObjectId(data.policyId) : undefined,
      contactedBy: new Types.ObjectId(userId),
      channel: data.channel || ContactChannel.PHONE,
      result: data.result || FollowUpResult.ANSWERED,
      notes: data.notes || 'Routine follow-up call logged',
      nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : undefined,
    });

    const populated = await created.populate([
      { path: 'customerId', select: 'name phone email' },
      { path: 'policyId', select: 'policyNumber type premium' },
    ]);

    // Broadcast real-time event to workspace
    this.eventsGateway.broadcastToWorkspace(companyId, 'FOLLOWUP_CREATED', populated);

    return populated;
  }

  async complete(companyId: string, id: string) {
    const updated = await this.followUpModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), companyId: new Types.ObjectId(companyId) },
      { result: FollowUpResult.RENEWAL_CONFIRMED },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Follow-up not found');
    }

    this.eventsGateway.broadcastToWorkspace(companyId, 'FOLLOWUP_UPDATED', updated);
    return updated;
  }
}
