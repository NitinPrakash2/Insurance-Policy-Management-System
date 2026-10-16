import { Controller, Get, Post, Patch, Body, Param, Headers } from '@nestjs/common';
import { FollowupsService } from './followups.service.js';

@Controller('followups')
export class FollowupsController {
  constructor(private readonly followupsService: FollowupsService) {}

  @Get()
  async findAll(@Headers('x-company-id') companyId: string) {
    return this.followupsService.findAll(companyId || '660000000000000000000001');
  }

  @Post()
  async create(
    @Headers('x-company-id') companyId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: any,
  ) {
    return this.followupsService.create(
      companyId || body.companyId || '660000000000000000000001',
      userId || '660000000000000000000002',
      body,
    );
  }

  @Patch(':id/complete')
  async complete(
    @Headers('x-company-id') companyId: string,
    @Param('id') id: string,
  ) {
    return this.followupsService.complete(companyId || '660000000000000000000001', id);
  }
}
