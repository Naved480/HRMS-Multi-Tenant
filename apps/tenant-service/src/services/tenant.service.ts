import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Tenant } from '../models/tenant.model';

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(Tenant)
    private tenantModel: typeof Tenant,
  ) {}

  /**
   * Create a new tenant
   */
  async createTenant(data: {
    name: string;
    organizationName: string;
    email: string;
    planType: string;
    isActive?: boolean;
  }): Promise<Tenant> {
    return this.tenantModel.create(data);
  }

  /**
   * Get tenant by ID
   */
  async getTenantById(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantModel.findByPk(tenantId);

    if (!tenant) {
      throw new NotFoundException(`Tenant ${tenantId} not found`);
    }

    return tenant;
  }

  /**
   * Get all tenants
   */
  async getAllTenants(): Promise<Tenant[]> {
    return this.tenantModel.findAll();
  }

  /**
   * Update tenant
   */
  async updateTenant(
    tenantId: string,
    updates: Partial<Tenant>,
  ): Promise<Tenant> {
    const tenant = await this.getTenantById(tenantId);
    return tenant.update(updates);
  }

  /**
   * Delete tenant
   */
  async deleteTenant(tenantId: string): Promise<void> {
    const tenant = await this.getTenantById(tenantId);
    await tenant.destroy();
  }

  /**
   * Get tenants by plan type
   */
  async getTenantsByPlan(planType: string): Promise<Tenant[]> {
    return this.tenantModel.findAll({
      where: { planType },
    });
  }
}
