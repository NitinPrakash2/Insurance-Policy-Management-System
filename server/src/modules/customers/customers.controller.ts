import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { CustomersService } from './customers.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../schemas/user.schema.js';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(@Request() req: any, @Query('search') search?: string) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.customersService.findAll(req.user.companyId.toString(), req.user, search);
  }

  @Get(':id')
  async findOne(@Request() req: any, @Param('id') id: string) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.customersService.findOne(req.user.companyId.toString(), id);
  }

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.customersService.create(req.user.companyId.toString(), req.user._id.toString(), body);
  }

  @Put(':id')
  async update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.customersService.update(req.user.companyId.toString(), id, body);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY_ADMIN)
  async remove(@Request() req: any, @Param('id') id: string) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.customersService.remove(req.user.companyId.toString(), id);
  }
}
