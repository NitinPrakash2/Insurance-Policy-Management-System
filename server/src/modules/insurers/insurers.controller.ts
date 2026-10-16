import { Controller, Get, Post, Put, Patch, Delete, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { InsurersService } from './insurers.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../schemas/user.schema.js';

@Controller('insurers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InsurersController {
  constructor(private readonly insurersService: InsurersService) {}

  @Get()
  async findAll(@Request() req: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.insurersService.findAll(req.user.companyId.toString());
  }

  @Post()
  @Roles(UserRole.COMPANY_ADMIN)
  async create(@Request() req: any, @Body() body: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.insurersService.create(req.user.companyId.toString(), body);
  }

  @Put(':id')
  @Roles(UserRole.COMPANY_ADMIN)
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.insurersService.update(req.user.companyId.toString(), id, body);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.COMPANY_ADMIN)
  async toggleActive(@Request() req: any, @Param('id') id: string) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.insurersService.toggleActive(req.user.companyId.toString(), id);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN)
  async remove(@Request() req: any, @Param('id') id: string) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.insurersService.remove(req.user.companyId.toString(), id);
  }
}
