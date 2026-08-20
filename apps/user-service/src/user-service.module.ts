import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  TenantContextModule,
  TenantResolverMiddleware,
} from '@app/tenant-context';
import { UserServiceController } from './user-service.controller';
import { UserService } from './services/user.service';
import { RoleService } from './services/role.service';
import { TenantModelProviderService } from './services/tenant-model-provider.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TenantContextModule,
  ],
  controllers: [UserServiceController],
  providers: [
    TenantModelProviderService,
    UserService,
    RoleService,
  ],
  exports: [
    TenantModelProviderService,
    UserService,
    RoleService,
  ],
})
export class UserServiceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantResolverMiddleware).forRoutes('*');
  }
}
