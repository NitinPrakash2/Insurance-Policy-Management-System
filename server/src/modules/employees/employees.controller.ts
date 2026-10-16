import { Controller, Get, Post, Put, Patch, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { EmployeesService } from './employees.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../schemas/user.schema.js';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @Roles(UserRole.COMPANY_ADMIN)
  async findAll(@Request() req: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.employeesService.findAll(req.user.companyId.toString());
  }

  @Post()
  @Roles(UserRole.COMPANY_ADMIN)
  async create(@Request() req: any, @Body() body: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.employeesService.create(req.user.companyId.toString(), body);
  }

  @Put(':id')
  @Roles(UserRole.COMPANY_ADMIN)
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.employeesService.update(req.user.companyId.toString(), id, body);
  }

  @Patch(':id/toggle-status')
  @Roles(UserRole.COMPANY_ADMIN)
  async toggleStatus(@Request() req: any, @Param('id') id: string) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.employeesService.toggleStatus(req.user.companyId.toString(), id);
  }
}
