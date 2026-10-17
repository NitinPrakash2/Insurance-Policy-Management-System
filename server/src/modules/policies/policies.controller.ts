import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { PoliciesService } from './policies.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../schemas/user.schema.js';

@Controller('policies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  async findAll(@Request() req: any, @Query() query: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.policiesService.findAll(req.user.companyId.toString(), req.user, query);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.policiesService.findOne(req.user.companyId.toString(), req.user, id);
  }

  @Post()
  @Roles(UserRole.COMPANY_ADMIN, UserRole.OFFICE_STAFF, UserRole.SALESMAN)
  async create(@Request() req: any, @Body() body: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.policiesService.create(req.user.companyId.toString(), body);
  }

  @Put(':id')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.OFFICE_STAFF)
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.policiesService.update(req.user.companyId.toString(), id, body);
  }

  @Post(':id/rollover')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.OFFICE_STAFF)
  async rollover(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.policiesService.rolloverRenewal(req.user.companyId.toString(), id, body);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN)
  async remove(@Request() req: any, @Param('id') id: string) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.policiesService.remove(req.user.companyId.toString(), id);
  }
}
