import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseModule } from '@app/database';
import { TenantServiceController } from './tenant-service.controller';
import { TenantServiceService } from './tenant-service.service';
import { Tenant, TenantDatabaseConfig, Department, Designation } from './models';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    SequelizeModule.forFeature([Tenant, TenantDatabaseConfig, Department, Designation]),
  ],
  controllers: [TenantServiceController],
  providers: [TenantServiceService],
  exports: [TenantServiceService],
})
export class TenantServiceModule {}
