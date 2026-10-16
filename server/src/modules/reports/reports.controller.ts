import { Controller, Get, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ReportsService } from './reports.service.js';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/guards/roles.guard.js';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  async getDashboardSummary(@Request() req: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('Tenant company context required');
    }
    return this.reportsService.getDashboardSummary(req.user.companyId.toString(), req.user);
  }
}
