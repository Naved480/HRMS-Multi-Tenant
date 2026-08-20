import { Controller, Post, Get, Body, Param, Delete } from '@nestjs/common';
import { TenantService } from './services/tenant.service';
import { TenantProvisioningService } from './services/tenant-provisioning.service';

@Controller('tenants')
export class TenantServiceController {
  constructor(
    private tenantService: TenantService,
    private tenantProvisioningService: TenantProvisioningService,
  ) {}

  @Post('provision')
  async provisionTenant(
    @Body()
    data: {
      tenantName: string;
      organizationName: string;
      email: string;
      planType: string;
    },
  ) {
    return this.tenantProvisioningService.provisionNewTenant(
      data.tenantName,
      data.organizationName,
      data.email,
      data.planType,
    );
  }

  @Get()
  async getAllTenants() {
    return this.tenantService.getAllTenants();
  }

  @Get(':id')
  async getTenantById(@Param('id') tenantId: string) {
    return this.tenantService.getTenantById(tenantId);
  }

  @Delete(':id')
  async deprovisionTenant(@Param('id') tenantId: string) {
    await this.tenantProvisioningService.deprovisionTenant(tenantId);
    return { message: `Tenant ${tenantId} deprovisioned` };
  }
}
