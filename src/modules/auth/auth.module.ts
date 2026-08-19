import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Tenant, User, Role, EmployeeProfile, SuperAdmin, TenantDatabaseConfig } from '../../database/models';
import { OtpService } from '../../../apps/auth-service/src/otp.service';
import { TenantConnectionManager } from '../../core/tenant-connection.manager';

@Module({
  imports: [
    SequelizeModule.forFeature([Tenant, User, Role, EmployeeProfile, SuperAdmin, TenantDatabaseConfig]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'super_secret_hrms_key'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, TenantConnectionManager],
  exports: [AuthService, JwtModule, TenantConnectionManager],
})
export class AuthModule {}

