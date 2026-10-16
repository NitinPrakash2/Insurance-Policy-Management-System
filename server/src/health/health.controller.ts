import { Controller, Get } from '@nestjs/common';
import mongoose from 'mongoose';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    const isDbConnected = mongoose.connection.readyState === 1;
    return {
      status: 'ok',
      database: isDbConnected ? 'connected' : 'local',
    };
  }
}
