import { Module, Global } from '@nestjs/common';
import { TenantContextService } from './context/tenant-context.service';
import { TenantRequestContextService } from './context/tenant-request-context.service';
import { TenantConnectionManager } from './context/tenant-connection.manager';
import { TenantResolverMiddleware } from './middleware/tenant-resolver.middleware';
import { TenantGuard } from './guards/tenant.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { OrganizationModuleGuard } from './guards/organization-module.guard';

@Global()
@Module({
  providers: [
    TenantContextService,
    TenantRequestContextService,
    TenantConnectionManager,
    TenantResolverMiddleware,
    TenantGuard,
    RolesGuard,
    PermissionsGuard,
    OrganizationModuleGuard,
  ],
  exports: [
    TenantContextService,
    TenantRequestContextService,
    TenantConnectionManager,
    TenantResolverMiddleware,
    TenantGuard,
    RolesGuard,
    PermissionsGuard,
    OrganizationModuleGuard,
  ],
})
export class TenantContextModule {}
