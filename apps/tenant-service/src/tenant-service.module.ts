import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseModule } from '@app/database';
import { TenantContextModule } from '@app/tenant-context';
import { TenantService } from './services/tenant.service';
import { TenantDatabaseConfigService } from './services/tenant-database-config.service';
import { TenantProvisioningService } from './services/tenant-provisioning.service';
import { TenantServiceController } from './tenant-service.controller';
import {
  Tenant,
  TenantDatabaseConfig,
  Department,
  Designation,
} from './models';

@Module({
  imports: [
    DatabaseModule.forRoot({ isPlatform: true }),
    SequelizeModule.forFeature([Tenant, TenantDatabaseConfig, Department, Designation]),
    TenantContextModule,
  ],
  providers: [
    TenantService,
    TenantDatabaseConfigService,
    TenantProvisioningService,
  ],
  controllers: [TenantServiceController],
  exports: [
    TenantService,
    TenantDatabaseConfigService,
    TenantProvisioningService,
  ],
})
export class TenantServiceModule {}
