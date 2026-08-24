import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { DatabaseModule } from '@app/database';
import { TenantContextModule } from '@app/tenant-context';
import { SERVICES } from '@app/common';
import { TenantService } from './services/tenant.service';
import { TenantDatabaseConfigService } from './services/tenant-database-config.service';
import { TenantProvisioningService } from './services/tenant-provisioning.service';
import { OrganizationAdminInvitationService } from './services/organization-admin-invitation.service';
import { OrganizationSetupService } from './services/organization-setup.service';
import { PolicyConfigurationValidatorService } from './services/policy-configuration-validator.service';
import { OrganizationPolicyService } from './services/organization-policy.service';
import { TenantServiceController } from './tenant-service.controller';
import {
  Tenant,
  TenantDatabaseConfig,
  Department,
  Designation,
  OrganizationAdminInvitation,
  WorkingHours,
  LeavePolicy,
  AttendancePolicy,
  OrganizationPolicy,
} from './models';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule.forRoot({ isPlatform: true }),
    SequelizeModule.forFeature([
      Tenant,
      TenantDatabaseConfig,
      Department,
      Designation,
      OrganizationAdminInvitation,
      WorkingHours,
      LeavePolicy,
      AttendancePolicy,
      OrganizationPolicy,
    ]),
    TenantContextModule,
    ClientsModule.registerAsync([
      {
        name: SERVICES.AUTH_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get('AUTH_SERVICE_HOST', 'localhost'),
            port: config.get('AUTH_SERVICE_PORT', 3001),
          },
        }),
      },
      {
        name: SERVICES.USER_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get('USER_SERVICE_HOST', 'localhost'),
            port: config.get('USER_SERVICE_PORT', 3003),
          },
        }),
      },
    ]),
  ],
  providers: [
    TenantService,
    TenantDatabaseConfigService,
    TenantProvisioningService,
    OrganizationAdminInvitationService,
    OrganizationSetupService,
    PolicyConfigurationValidatorService,
    OrganizationPolicyService,
  ],
  controllers: [TenantServiceController],
  exports: [
    TenantService,
    TenantDatabaseConfigService,
    TenantProvisioningService,
    OrganizationAdminInvitationService,
    OrganizationSetupService,
    PolicyConfigurationValidatorService,
    OrganizationPolicyService,
  ],
})
export class TenantServiceModule {}
