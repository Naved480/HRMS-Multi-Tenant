import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseModule } from '@app/database';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';
import { User, Role, Permission, UserRole, RolePermission } from './models';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    SequelizeModule.forFeature([User, Role, Permission, UserRole, RolePermission]),
  ],
  controllers: [UserServiceController],
  providers: [UserServiceService],
  exports: [UserServiceService],
})
export class UserServiceModule {}
