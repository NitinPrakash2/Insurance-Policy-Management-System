import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CompaniesService } from './companies.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../schemas/user.schema.js';
import { CompanyStatus } from '../../schemas/company.schema.js';

@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get('platform-overview')
  @Roles(UserRole.SUPER_ADMIN)
  async getOverview() {
    return this.companiesService.getPlatformOverview();
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  async findAll(@Query('search') search?: string, @Query('status') status?: string) {
    return this.companiesService.findAll(search, status);
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN)
  async findOne(@Param('id') id: string) {
    return this.companiesService.findOne(id);
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  async create(@Body() body: any) {
    return this.companiesService.createCompany(body);
  }

  @Patch(':id/status')
  @Roles(UserRole.SUPER_ADMIN)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: CompanyStatus,
    @Body('reason') reason?: string,
  ) {
    return this.companiesService.updateStatus(id, status, reason);
  }

  @Patch(':id/slots')
  @Roles(UserRole.SUPER_ADMIN)
  async updateSlots(@Param('id') id: string, @Body('maxSlots') maxSlots: number) {
    return this.companiesService.updateSlots(id, maxSlots);
  }
}
