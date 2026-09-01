import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseModule } from '@app/database';
import { TenantContextModule } from '@app/tenant-context';
import { AuthService } from './services/auth.service';
import { OtpService } from './services/otp.service';
import { AuthMicroserviceController } from './controllers/auth.controller';
import { SuperAdmin, AuthCredential } from './models';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule.forRoot({ isPlatform: true }),
    SequelizeModule.forFeature([SuperAdmin, AuthCredential]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'hrms-super-secret-key-change-in-production'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
    TenantContextModule,
  ],
  providers: [AuthService, OtpService],
  controllers: [AuthMicroserviceController],
  exports: [AuthService, OtpService, JwtModule],
})
export class AuthServiceModule {}
