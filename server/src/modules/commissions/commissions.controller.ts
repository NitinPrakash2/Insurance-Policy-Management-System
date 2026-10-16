import { Controller, Get, Patch, Param, Body, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { CommissionsService } from './commissions.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';
import { Roles } from '../../auth/decorators/roles.decorator.js';
import { UserRole } from '../../schemas/user.schema.js';

@Controller('commissions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get('summary')
  async getSummary(@Request() req: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.commissionsService.getSummary(req.user.companyId.toString(), req.user);
  }

  @Get('ledger')
  async findAll(@Request() req: any, @Query('salesmanId') salesmanId?: string) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.commissionsService.findAll(req.user.companyId.toString(), req.user, salesmanId);
  }

  @Patch(':id/salesman-payout')
  @Roles(UserRole.COMPANY_ADMIN)
  async recordSalesmanPayout(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.commissionsService.recordSalesmanPayout(req.user.companyId.toString(), id, body);
  }

  @Patch(':id/insurer-receipt')
  @Roles(UserRole.COMPANY_ADMIN)
  async recordInsurerReceipt(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.commissionsService.recordInsurerReceipt(req.user.companyId.toString(), id, body);
  }
}
