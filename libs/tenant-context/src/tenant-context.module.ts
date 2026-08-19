import { Module } from '@nestjs/common';
import { TenantConnectionManager } from './context/tenant-connection.manager';
import { TenantContextService } from './context/tenant-context.service';
import { TenantGuard } from './guards/tenant.guard';

@Module({
  providers: [TenantConnectionManager, TenantContextService, TenantGuard],
  exports: [TenantConnectionManager, TenantContextService, TenantGuard],
})
export class TenantContextModule {}
