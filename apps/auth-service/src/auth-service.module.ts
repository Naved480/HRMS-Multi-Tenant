import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseModule } from '@app/database';
import { AuthMicroserviceController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { OtpService } from './services/otp.service';
import { SuperAdmin, AuthCredential } from './models';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    SequelizeModule.forFeature([SuperAdmin, AuthCredential]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'super_secret_hrms_key'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  controllers: [AuthMicroserviceController],
  providers: [AuthService, OtpService],
  exports: [AuthService, JwtModule],
})
export class AuthServiceModule {}
