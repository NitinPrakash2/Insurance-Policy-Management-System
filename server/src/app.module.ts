import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './database/database.module.js';
import { EventsModule } from './events/events.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CompaniesModule } from './modules/companies/companies.module.js';
import { CustomersModule } from './modules/customers/customers.module.js';
import { InsurersModule } from './modules/insurers/insurers.module.js';
import { PoliciesModule } from './modules/policies/policies.module.js';
import { InstalmentsModule } from './modules/instalments/instalments.module.js';
import { CommissionsModule } from './modules/commissions/commissions.module.js';
import { EmployeesModule } from './modules/employees/employees.module.js';
import { ReportsModule } from './modules/reports/reports.module.js';
import { FollowupsModule } from './modules/followups/followups.module.js';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module.js';
import { HealthModule } from './health/health.module.js';

let mongodInstance: MongoMemoryServer | null = null;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const logger = new Logger('DatabaseInit');
        const atlasUri = configService.get<string>('MONGODB_URI');

        if (atlasUri) {
          try {
            const conn = await mongoose.createConnection(atlasUri, {
              serverSelectionTimeoutMS: 3000,
            }).asPromise();
            await conn.close();
            console.log('INFO:     Database: Connected to MongoDB Atlas cluster');
            return { uri: atlasUri };
          } catch {
            console.log('INFO:     Database: Atlas not accessible (IP not whitelisted). Using local MongoDB');
          }
        }

        // Resilient in-memory fallback
        if (!mongodInstance) {
          mongodInstance = await MongoMemoryServer.create();
        }
        const memUri = mongodInstance.getUri();
        return { uri: memUri };
      },
      inject: [ConfigService],
    }),
    DatabaseModule,
    EventsModule,
    AuthModule,
    CompaniesModule,
    CustomersModule,
    InsurersModule,
    PoliciesModule,
    InstalmentsModule,
    CommissionsModule,
    EmployeesModule,
    ReportsModule,
    FollowupsModule,
    AuditLogsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
