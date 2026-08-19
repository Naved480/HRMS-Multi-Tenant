import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { AuthModule } from '../../../src/modules/auth/auth.module';
import { AuthMicroserviceController } from './auth-service.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
  ],
  controllers: [AuthMicroserviceController],
})
export class AuthServiceModule {}
