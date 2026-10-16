import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from '../schemas/user.schema.js';
import { Company, CompanyDocument, CompanyStatus } from '../schemas/company.schema.js';
import { Insurer, InsurerDocument, InsurerType } from '../schemas/insurer.schema.js';
import { Customer, CustomerDocument } from '../schemas/customer.schema.js';
import { Policy, PolicyDocument, PolicyStatus, PaymentFrequency } from '../schemas/policy.schema.js';
import { Instalment, InstalmentDocument, InstalmentStatus, PaymentMode } from '../schemas/instalment.schema.js';
import { Commission, CommissionDocument, CommissionStatus } from '../schemas/commission.schema.js';
import { FollowUp, FollowUpDocument, FollowUpResult, ContactChannel } from '../schemas/follow-up.schema.js';
import { AuditLog, AuditLogDocument } from '../schemas/audit-log.schema.js';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Insurer.name) private insurerModel: Model<InsurerDocument>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(Policy.name) private policyModel: Model<PolicyDocument>,
    @InjectModel(Instalment.name) private instalmentModel: Model<InstalmentDocument>,
    @InjectModel(Commission.name) private commissionModel: Model<CommissionDocument>,
    @InjectModel(FollowUp.name) private followUpModel: Model<FollowUpDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedData();
  }

  async seedData() {
    const userCount = await this.userModel.countDocuments();
    if (userCount > 0) {
      this.logger.log('Database already initialized with data, skipping seed');
      return;
    }

    this.logger.log('🌱 Starting comprehensive database seed with real data...');
    const saltRounds = 10;
    const defaultPasswordHash = await bcrypt.hash('Password@123', saltRounds);

    // 1. Primary Tenant: Shree Insurance Advisors
    const shreeCompany = await this.companyModel.create({
      name: 'Shree Insurance Advisors',
      slug: 'shree-insurance',
      status: CompanyStatus.ACTIVE,
      maxSlots: 10,
      address: 'Pune · Maharashtra',
      phone: '98220 10000',
      email: 'anjali@shreeadvisors.in',
      branding: {
        logoUrl: '',
        primaryColor: '#C05D34',
      },
    });

    // Other Tenants for Super Admin
    await this.companyModel.create({
      name: 'Apex Shield Insurance Brokers Ltd',
      slug: 'apex-shield',
      status: CompanyStatus.ACTIVE,
      maxSlots: 15,
      address: 'Mumbai · Maharashtra',
      phone: '98200 44000',
      email: 'rajesh@apexshield.in',
    });

    await this.companyModel.create({
      name: 'SecureLife Consultants',
      slug: 'securelife',
      status: CompanyStatus.SUSPENDED,
      maxSlots: 8,
      address: 'Bengaluru · Karnataka',
      phone: '98450 33000',
      email: 'anand@securelife.co.in',
    });

    const companyId = shreeCompany._id;

    // 2. Users for Shree Insurance Advisors
    // Super Admin (Platform-level)
    const superAdmin = await this.userModel.create({
      name: 'Platform Super Admin',
      email: 'superadmin@prosurance.com',
      passwordHash: defaultPasswordHash,
      role: UserRole.SUPER_ADMIN,
      permissions: ['*'],
    });

    // Company Admin
    const companyAdmin = await this.userModel.create({
      companyId,
      name: 'Anjali Deshmukh',
      email: 'anjali@shreeadvisors.in',
      passwordHash: defaultPasswordHash,
      role: UserRole.COMPANY_ADMIN,
      phone: '98220 10001',
      permissions: ['*'],
    });

    // Office Staff
    const officeStaff = await this.userModel.create({
      companyId,
      name: 'Sunita Rao (Staff)',
      email: 'staff@shreeadvisors.in',
      passwordHash: defaultPasswordHash,
      role: UserRole.OFFICE_STAFF,
      phone: '98220 10002',
      permissions: ['customers:read', 'customers:create', 'policies:read', 'policies:create', 'payments:update'],
    });

    // Salesmen
    const salesman1 = await this.userModel.create({
      companyId,
      name: 'Amit Sharma',
      email: 'amit@shreeadvisors.in',
      passwordHash: defaultPasswordHash,
      role: UserRole.SALESMAN,
      phone: '98220 10003',
      salesmanCode: 'AM-01',
      defaultCommissionRate: 8,
      permissions: ['assigned:read', 'assigned:create'],
    });

    const salesman2 = await this.userModel.create({
      companyId,
      name: 'Sunil Verma',
      email: 'sunil@shreeadvisors.in',
      passwordHash: defaultPasswordHash,
      role: UserRole.SALESMAN,
      phone: '98220 10004',
      salesmanCode: 'SV-02',
      defaultCommissionRate: 7.5,
      permissions: ['assigned:read', 'assigned:create'],
    });

    // 3. Insurers
    const insurers = await this.insurerModel.insertMany([
      { companyId, name: 'HDFC ERGO General Insurance', code: 'HERGO', type: InsurerType.GENERAL, contactPerson: 'Rahul Kapoor', phone: '020-4522 3300' },
      { companyId, name: 'ICICI Lombard General Insurance', code: 'ICICIL', type: InsurerType.GENERAL, contactPerson: 'Anil Mehta', phone: '020-4110 7724' },
      { companyId, name: 'Star Health & Allied Insurance', code: 'STAR', type: InsurerType.HEALTH, contactPerson: 'Suresh Patil', phone: '020-2287 6541' },
      { companyId, name: 'LIC of India', code: 'LIC', type: InsurerType.LIFE, contactPerson: 'Sunita Joshi', phone: '020-6612 9080' },
      { companyId, name: 'New India Assurance', code: 'NIA', type: InsurerType.GENERAL, contactPerson: 'Deepak Rana', phone: '020-455 8890' },
    ]);

    // 4. Customers
    const customers = await this.customerModel.insertMany([
      { companyId, name: 'Ramesh Patil', phone: '98220 11223', email: 'ramesh.patil@gmail.com', city: 'Pune', createdBy: companyAdmin._id },
      { companyId, name: 'Priya Shah', phone: '98221 44556', email: 'priya.shah@outlook.com', city: 'Mumbai', createdBy: companyAdmin._id },
      { companyId, name: 'Arjun Mehta', phone: '97650 88231', email: 'arjun.mehta@yahoo.com', city: 'Nashik', createdBy: salesman1._id },
      { companyId, name: 'Sunita Rao', phone: '98901 22334', email: 'sunita.rao@techcorp.in', city: 'Pune', createdBy: salesman2._id },
      { companyId, name: 'Vikram Joshi', phone: '98210 99887', email: 'vikram@joshienterprises.com', city: 'Thane', createdBy: companyAdmin._id },
    ]);

    // 5. Policies
    const now = new Date();
    const addDays = (d: number) => new Date(now.getTime() + d * 86400000);

    const pol1 = await this.policyModel.create({
      companyId,
      policyNumber: 'HDFC-MOT-2025-00481',
      customerId: customers[0]._id,
      insurerId: insurers[0]._id,
      salesmanId: salesman1._id,
      type: 'Motor',
      sumInsured: 500000,
      premium: 24000,
      startDate: addDays(-360),
      expiryDate: addDays(-5), // Overdue 5 days
      paymentFrequency: PaymentFrequency.YEARLY,
      status: PolicyStatus.OVERDUE,
      vehicleNumber: 'MH-12-DE-4412',
      hasDocument: true,
      documentFileName: 'Policy_HDFC_00481.pdf',
    });

    const pol2 = await this.policyModel.create({
      companyId,
      policyNumber: 'LIC-LF-99210-449',
      customerId: customers[1]._id,
      insurerId: insurers[3]._id,
      salesmanId: salesman2._id,
      type: 'Life',
      sumInsured: 1500000,
      premium: 18450,
      startDate: addDays(-362),
      expiryDate: addDays(-3), // Overdue 3 days
      paymentFrequency: PaymentFrequency.YEARLY,
      status: PolicyStatus.OVERDUE,
      hasDocument: true,
      documentFileName: 'Policy_LIC_99210.pdf',
    });

    const pol3 = await this.policyModel.create({
      companyId,
      policyNumber: 'ICICI-MOT-77821-002',
      customerId: customers[2]._id,
      insurerId: insurers[1]._id,
      salesmanId: salesman1._id,
      type: 'Motor',
      sumInsured: 1000000,
      premium: 12000,
      startDate: addDays(-365),
      expiryDate: now, // Due Today
      paymentFrequency: PaymentFrequency.YEARLY,
      status: PolicyStatus.DUE_SOON,
      vehicleNumber: 'MH-15-AB-9090',
      hasDocument: false,
    });

    const pol4 = await this.policyModel.create({
      companyId,
      policyNumber: 'STAR-HLT-2025-9988',
      customerId: customers[3]._id,
      insurerId: insurers[2]._id,
      salesmanId: salesman2._id,
      type: 'Health',
      sumInsured: 1000000,
      premium: 32500,
      startDate: addDays(-362),
      expiryDate: addDays(3), // In 3 days
      paymentFrequency: PaymentFrequency.YEARLY,
      status: PolicyStatus.DUE_SOON,
      hasDocument: true,
      documentFileName: 'Policy_STAR_9988.pdf',
    });

    const pol5 = await this.policyModel.create({
      companyId,
      policyNumber: 'NIA-FIRE-55410-09',
      customerId: customers[4]._id,
      insurerId: insurers[4]._id,
      salesmanId: salesman1._id,
      type: 'Commercial',
      sumInsured: 5000000,
      premium: 15200,
      startDate: addDays(-358),
      expiryDate: addDays(7), // In 7 days
      paymentFrequency: PaymentFrequency.YEARLY,
      status: PolicyStatus.ACTIVE,
      hasDocument: true,
      documentFileName: 'Policy_NIA_55410.pdf',
    });

    // 6. Commissions
    await this.commissionModel.create({
      companyId,
      policyId: pol1._id,
      salesmanId: salesman1._id,
      insurerCommissionRate: 15,
      insurerExpectedAmount: 3600,
      insurerReceivedAmount: 3600,
      salesmanCommissionRate: 8,
      salesmanEarnedAmount: 1920,
      salesmanPaidAmount: 1920,
      status: CommissionStatus.SETTLED,
    });

    await this.commissionModel.create({
      companyId,
      policyId: pol2._id,
      salesmanId: salesman2._id,
      insurerCommissionRate: 20,
      insurerExpectedAmount: 3690,
      insurerReceivedAmount: 0,
      salesmanCommissionRate: 7.5,
      salesmanEarnedAmount: 1383,
      salesmanPaidAmount: 0,
      status: CommissionStatus.UNPAID,
    });

    await this.commissionModel.create({
      companyId,
      policyId: pol3._id,
      salesmanId: salesman1._id,
      insurerCommissionRate: 15,
      insurerExpectedAmount: 1800,
      insurerReceivedAmount: 0,
      salesmanCommissionRate: 8,
      salesmanEarnedAmount: 960,
      salesmanPaidAmount: 0,
      status: CommissionStatus.UNPAID,
    });

    // 7. Follow-ups
    await this.followUpModel.insertMany([
      {
        companyId,
        customerId: customers[1]._id,
        policyId: pol2._id,
        contactedBy: companyAdmin._id,
        channel: ContactChannel.PHONE,
        result: FollowUpResult.PROMISE_TO_PAY,
        notes: 'Life renewal premium collection — client requested callback before 12pm',
        nextFollowUpDate: addDays(1),
      },
      {
        companyId,
        customerId: customers[0]._id,
        policyId: pol1._id,
        contactedBy: officeStaff._id,
        channel: ContactChannel.PHONE,
        result: FollowUpResult.ANSWERED,
        notes: 'Ask for payment confirmation / cheque receipt reference for Optima Secure',
        nextFollowUpDate: addDays(2),
      },
      {
        companyId,
        customerId: customers[2]._id,
        policyId: pol3._id,
        contactedBy: salesman1._id,
        channel: ContactChannel.PHONE,
        result: FollowUpResult.CALLBACK_REQUESTED,
        notes: 'Disclose motor renewal quote & terms with 20% NCB benefit applied',
        nextFollowUpDate: addDays(3),
      },
    ]);

    // 8. Platform Audit Logs
    await this.auditLogModel.insertMany([
      {
        actorId: superAdmin._id,
        actorRole: 'SUPER_ADMIN',
        companyId,
        entity: 'Company',
        action: 'Provisioned company workspace with 10 slots capacity',
        ipAddress: '127.0.0.1',
      },
      {
        actorId: companyAdmin._id,
        actorRole: 'COMPANY_ADMIN',
        companyId,
        entity: 'Policy',
        action: 'Assigned policy HDFC-MOT-2025-00481 to salesman Amit Sharma',
        ipAddress: '127.0.0.1',
      },
      {
        actorId: officeStaff._id,
        actorRole: 'OFFICE_STAFF',
        companyId,
        entity: 'Customer',
        action: 'Verified KYC documents for Ramesh Patil',
        ipAddress: '127.0.0.1',
      },
    ]);

    this.logger.log('✅ Real database seed successfully completed!');
  }
}
