import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Company, CompanyDocument, CompanyStatus } from '../../schemas/company.schema.js';
import { User, UserDocument, UserRole, UserStatus } from '../../schemas/user.schema.js';
import { AuditLog, AuditLogDocument } from '../../schemas/audit-log.schema.js';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async getPlatformOverview() {
    const totalCompanies = await this.companyModel.countDocuments();
    const activeCompanies = await this.companyModel.countDocuments({ status: CompanyStatus.ACTIVE });
    const suspendedCompanies = await this.companyModel.countDocuments({ status: CompanyStatus.SUSPENDED });
    
    const companies = await this.companyModel.find();
    const totalSlots = companies.reduce((acc, c) => acc + (c.maxSlots || 10), 0);

    const activeEmployees = await this.userModel.countDocuments({
      role: { $in: [UserRole.OFFICE_STAFF, UserRole.SALESMAN] },
      status: UserStatus.ACTIVE,
    });


    const recentTenants = await this.companyModel.find().sort({ createdAt: -1 }).limit(5);

    return {
      totalCompanies,
      activeCompanies,
      suspendedCompanies,
      totalSlots,
      usedSlots: activeEmployees,
      recentTenants,
    };
  }

  async findAll(search?: string, status?: string) {
    const query: any = {};
    if (status && status !== 'All') {
      query.status = status;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    return this.companyModel.find(query).sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const company = await this.companyModel.findById(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    const admin = await this.userModel.findOne({ companyId: company._id, role: UserRole.COMPANY_ADMIN }).select('-passwordHash');
    const employeesCount = await this.userModel.countDocuments({
      companyId: new Types.ObjectId(company._id.toString()),
      role: { $in: [UserRole.OFFICE_STAFF, UserRole.SALESMAN] },
      status: UserStatus.ACTIVE,
    });


    return {
      company,
      admin,
      slotUsage: {
        used: employeesCount,
        max: company.maxSlots,
        available: Math.max(0, company.maxSlots - employeesCount),
      },
    };
  }

  async createCompany(data: {
    name: string;
    slug: string;
    address?: string;
    phone?: string;
    email?: string;
    maxSlots?: number;
    adminName: string;
    adminEmail: string;
    adminPhone?: string;
  }) {
    const existing = await this.companyModel.findOne({ slug: data.slug.toLowerCase().trim() });
    if (existing) {
      throw new ConflictException('Company slug is already registered');
    }
    const existingUser = await this.userModel.findOne({ email: data.adminEmail.toLowerCase().trim() });
    if (existingUser) {
      throw new ConflictException('Admin email is already registered');
    }

    const company = await this.companyModel.create({
      name: data.name.trim(),
      slug: data.slug.toLowerCase().trim(),
      address: data.address,
      phone: data.phone,
      email: data.email,
      maxSlots: Number(data.maxSlots) || 10,
      status: CompanyStatus.ACTIVE,
    });

    const passwordHash = await bcrypt.hash('Admin@123', 10);
    const admin = await this.userModel.create({
      companyId: company._id,
      name: data.adminName.trim(),
      email: data.adminEmail.toLowerCase().trim(),
      phone: data.adminPhone,
      passwordHash,
      role: UserRole.COMPANY_ADMIN,
      permissions: ['*'],
    });

    await this.auditLogModel.create({
      actorRole: 'SUPER_ADMIN',
      action: 'COMPANY_CREATED',
      entity: 'Company',
      entityId: company._id.toString(),
      details: { companyName: company.name, adminEmail: admin.email, maxSlots: company.maxSlots },
    });

    return { company, admin: { id: admin._id, name: admin.name, email: admin.email } };
  }

  async updateStatus(id: string, status?: CompanyStatus, reason?: string) {
    const current = await this.companyModel.findById(id);
    if (!current) {
      throw new NotFoundException('Company not found');
    }

    const targetStatus = status || (current.status === CompanyStatus.ACTIVE ? CompanyStatus.SUSPENDED : CompanyStatus.ACTIVE);

    const company = await this.companyModel.findByIdAndUpdate(
      id,
      { status: targetStatus },
      { new: true },
    );

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.auditLogModel.create({
      actorRole: 'SUPER_ADMIN',
      action: targetStatus === CompanyStatus.SUSPENDED ? 'COMPANY_SUSPENDED' : 'COMPANY_ACTIVATED',
      entity: 'Company',
      entityId: company._id.toString(),
      details: { reason: reason || 'Status toggled from console' },
    });

    return company;
  }

  async updateSlots(id: string, maxSlots: number) {
    const company = await this.companyModel.findByIdAndUpdate(
      id,
      { maxSlots: Number(maxSlots) },
      { new: true },
    );
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return company;
  }

  async deleteCompany(id: string) {
    const company = await this.companyModel.findByIdAndDelete(id);
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    await this.userModel.deleteMany({ companyId: id });
    return { success: true, message: `Company ${company.name} deleted` };
  }
}
