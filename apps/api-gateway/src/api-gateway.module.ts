import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SERVICES } from '@app/common';
import { TenantContextModule } from '@app/tenant-context';
import { ApiGatewayAuthController } from './controllers/auth.controller';
import { SuperAdminController } from './controllers/superadmin.controller';
import { OrganizationAdminActivationController } from './controllers/activation.controller';
import { OrganizationSetupController } from './controllers/organization-setup.controller';
import { OrganizationPolicyController } from './controllers/organization-policy.controller';
import { OrganizationModulesController } from './controllers/organization-modules.controller';
import { OrganizationRolesController } from './controllers/organization-roles.controller';
import { ApiGatewayHealthController } from './controllers/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
        name: SERVICES.TENANT_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: config.get('TENANT_SERVICE_HOST', 'localhost'),
            port: config.get('TENANT_SERVICE_PORT', 3002),
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
  controllers: [
    ApiGatewayHealthController,
    ApiGatewayAuthController,
    SuperAdminController,
    OrganizationAdminActivationController,
    OrganizationSetupController,
    OrganizationPolicyController,
    OrganizationModulesController,
    OrganizationRolesController,
  ],
})
export class ApiGatewayModule {}
