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
    // Purge leftover dummy Figma policies/customers if previously seeded
    const dummyCustomer = await this.customerModel.findOne({ email: 'ramesh.patil@gmail.com' });
    if (dummyCustomer) {
      this.logger.log('🧹 Purging old Figma dummy policies & customers...');
      await this.policyModel.deleteMany({});
      await this.customerModel.deleteMany({});
      await this.followUpModel.deleteMany({});
      await this.commissionModel.deleteMany({});
      await this.instalmentModel.deleteMany({});
      this.logger.log('✨ Dummy data cleared! Database is now a clean slate for real business records.');
    }

    // Purge fake demo companies (Apex Shield & SecureLife)
    const fakeCompanies = await this.companyModel.deleteMany({
      slug: { $in: ['apex-shield', 'securelife'] },
    });
    if (fakeCompanies.deletedCount > 0) {
      this.logger.log(`🧹 Purged ${fakeCompanies.deletedCount} fake demo companies from database.`);
    }

    const userCount = await this.userModel.countDocuments();
    if (userCount > 0) {
      this.logger.log('Database already initialized with data, skipping seed');
      return;
    }

    this.logger.log('🌱 Starting clean database seed (Real baseline setup only)...');
    const saltRounds = 10;
    const defaultPasswordHash = await bcrypt.hash('Password@123', saltRounds);

    // 1. Primary Real Brokerage Organization
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

    // 4. Insurers only (needed for policy creation dropdowns)
    // No dummy customers or dummy policies - clean slate for real operations
    this.logger.log('✅ Clean database seed completed: Accounts and Insurers ready. 0 dummy policies/customers.');
  }
}
