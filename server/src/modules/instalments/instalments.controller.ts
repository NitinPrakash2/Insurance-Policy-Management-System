import { Controller, Get, Patch, Param, Body, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { InstalmentsService } from './instalments.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../schemas/user.schema.js';

@Controller('instalments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InstalmentsController {
  constructor(private readonly instalmentsService: InstalmentsService) {}

  @Get()
  async findAll(@Request() req: any, @Query() query: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.instalmentsService.findAll(req.user.companyId.toString(), req.user, query);
  }

  @Patch(':id/mark-paid')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.OFFICE_STAFF)
  async markPaid(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.instalmentsService.markPaid(req.user.companyId.toString(), id, body);
  }
}
