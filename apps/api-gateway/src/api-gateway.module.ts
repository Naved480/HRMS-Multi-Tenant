import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { SERVICES } from '@app/common';
import { ApiGatewayAuthController } from './auth.controller';
import { SuperAdminController } from './superadmin.controller';
import { OrganizationModulesController } from './organization-modules.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    ]),
  ],
  controllers: [
    ApiGatewayAuthController,
    SuperAdminController,
    OrganizationModulesController,
  ],
})
export class ApiGatewayModule {}

