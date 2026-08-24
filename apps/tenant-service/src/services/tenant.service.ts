import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Tenant, TenantStatus, TenantSetupStatus, TenantProvisioningStatus } from '../models/tenant.model';

@Injectable()
export class TenantService {
  constructor(
    @InjectModel(Tenant)
    private tenantModel: typeof Tenant,
  ) {}

  /**
   * Create a new tenant record
   */
  async createTenant(data: {
    name: string;
    organizationName?: string;
    slug?: string;
    domain?: string;
    email?: string;
    adminEmail?: string;
    planType?: string;
    status?: TenantStatus;
    setupStatus?: TenantSetupStatus;
    provisioningStatus?: TenantProvisioningStatus;
    isActive?: boolean;
  }): Promise<Tenant> {
    return this.tenantModel.create({
      name: data.name,
      organizationName: data.organizationName || data.name,
      slug: data.slug || data.domain,
      domain: data.domain || data.slug,
      email: data.email || data.adminEmail,
      adminEmail: data.adminEmail || data.email,
      planType: data.planType || 'standard',
      status: data.status || TenantStatus.DRAFT,
      setupStatus: data.setupStatus || TenantSetupStatus.NOT_STARTED,
      provisioningStatus: data.provisioningStatus || TenantProvisioningStatus.PENDING,
      isActive: data.isActive ?? true,
    });
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
   * Find tenant by domain or slug
   */
  async getTenantByDomainOrSlug(slugOrDomain: string): Promise<Tenant | null> {
    return this.tenantModel.findOne({
      where: {
        [Op.or]: [
          { slug: slugOrDomain },
          { domain: slugOrDomain },
        ],
      },
    });
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
