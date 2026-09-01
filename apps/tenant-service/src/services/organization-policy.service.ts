import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { InjectConnection } from '@nestjs/sequelize';
import {
  PolicyType,
  PolicyStatus,
  PolicySource,
  CreateOrganizationPolicyDto,
  UpdateOrganizationPolicyDto,
  ActivatePolicyDto,
  CreateNewPolicyVersionDto,
  GetPoliciesQueryDto,
  TenantException,
  TenantErrorCode,
} from '@app/common';
import { OrganizationPolicy } from '../models/organization-policy.model';
import { Tenant } from '../models/tenant.model';
import { TenantService } from './tenant.service';
import { PolicyConfigurationValidatorService } from './policy-configuration-validator.service';

// ==========================================
// POLICY EXCLUSIVITY RULES
// These policy types allow only ONE active policy per tenant at a time.
// ==========================================
const EXCLUSIVE_POLICY_TYPES: Set<PolicyType> = new Set([
  PolicyType.ATTENDANCE,
  PolicyType.OVERTIME,
  PolicyType.REMOTE_WORK,
  PolicyType.PAYROLL,
]);

@Injectable()
export class OrganizationPolicyService {
  private readonly logger = new Logger(OrganizationPolicyService.name);

  constructor(
    @InjectModel(OrganizationPolicy) private readonly policyModel: typeof OrganizationPolicy,
    @InjectConnection() private readonly sequelize: Sequelize,
    private readonly tenantService: TenantService,
    private readonly validator: PolicyConfigurationValidatorService,
  ) {}

  // ==========================================
  // PRIVATE HELPERS
  // ==========================================

  /**
   * Tenant-scoped findOne — never trust caller-provided tenantId without verifying the record.
   */
  private async findPolicyScoped(tenantId: string, policyId: string): Promise<OrganizationPolicy> {
    const policy = await this.policyModel.findOne({ where: { id: policyId, tenantId } });
    if (!policy) {
      throw new TenantException(TenantErrorCode.INVALID_TENANT_CONTEXT, `Policy '${policyId}' not found.`);
    }
    return policy;
  }

  /**
   * Validate configuration and throw on error.
   */
  private validateConfiguration(policyType: PolicyType, configuration: Record<string, unknown>): void {
    const result = this.validator.validate(policyType, configuration);
    if (!result.isValid) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        `Invalid policy configuration: ${result.errors.join('; ')}`,
      );
    }
  }

  /**
   * Enforce allowed status transitions.
   */
  private assertTransition(current: PolicyStatus, next: PolicyStatus, action: string): void {
    const allowed: Record<PolicyStatus, PolicyStatus[]> = {
      [PolicyStatus.DRAFT]: [PolicyStatus.ACTIVE, PolicyStatus.ARCHIVED],
      [PolicyStatus.ACTIVE]: [PolicyStatus.INACTIVE, PolicyStatus.ARCHIVED],
      [PolicyStatus.INACTIVE]: [PolicyStatus.ACTIVE, PolicyStatus.ARCHIVED],
      [PolicyStatus.ARCHIVED]: [],
    };
    if (!allowed[current].includes(next)) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        `Cannot ${action} policy: invalid transition from '${current}' to '${next}'.`,
      );
    }
  }

  // ==========================================
  // CREATE
  // ==========================================

  async createPolicy(tenantId: string, dto: CreateOrganizationPolicyDto, createdBy?: string) {
    await this.tenantService.getTenantById(tenantId);
    this.validateConfiguration(dto.policyType, dto.configuration);

    const policy = await this.policyModel.create({
      tenantId,
      policyType: dto.policyType,
      source: dto.source ?? PolicySource.SYSTEM,
      name: dto.name,
      description: dto.description ?? null,
      configuration: dto.configuration,
      version: 1,
      previousVersionId: null,
      status: PolicyStatus.DRAFT,
      effectiveFrom: dto.effectiveFrom ?? null,
      effectiveTo: dto.effectiveTo ?? null,
      createdBy: createdBy ?? null,
      updatedBy: createdBy ?? null,
    });

    this.logger.log(`Policy created: ${policy.id} [${policy.policyType}] for tenant ${tenantId}`);
    return policy;
  }

  // ==========================================
  // READ
  // ==========================================

  async getPolicies(tenantId: string, query?: GetPoliciesQueryDto) {
    await this.tenantService.getTenantById(tenantId);

    const where: Record<string, unknown> = { tenantId };
    if (query?.policyType) where.policyType = query.policyType;
    if (query?.status) where.status = query.status;
    if (query?.source) where.source = query.source;

    return this.policyModel.findAll({
      where,
      order: [
        ['policyType', 'ASC'],
        ['version', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });
  }

  async getPolicyById(tenantId: string, policyId: string) {
    return this.findPolicyScoped(tenantId, policyId);
  }

  /**
   * Get the currently applicable active policy for a given type.
   * Considers effectiveFrom/effectiveTo dates when set.
   */
  async getActivePolicy(tenantId: string, policyType: PolicyType) {
    await this.tenantService.getTenantById(tenantId);

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const policy = await this.policyModel.findOne({
      where: {
        tenantId,
        policyType,
        status: PolicyStatus.ACTIVE,
        [Op.or]: [
          { effectiveFrom: { [Op.lte]: today }, effectiveTo: { [Op.gte]: today } },
          { effectiveFrom: { [Op.lte]: today }, effectiveTo: null },
          { effectiveFrom: null, effectiveTo: null },
          { effectiveFrom: null, effectiveTo: { [Op.gte]: today } },
        ],
      },
      order: [['effectiveFrom', 'DESC']],
    });

    return policy ?? null;
  }

  // ==========================================
  // UPDATE
  // ==========================================

  async updatePolicy(tenantId: string, policyId: string, dto: UpdateOrganizationPolicyDto, updatedBy?: string) {
    const policy = await this.findPolicyScoped(tenantId, policyId);

    if (policy.status === PolicyStatus.ARCHIVED) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        'Archived policies cannot be modified.',
      );
    }

    if (policy.status === PolicyStatus.ACTIVE) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        'Active policies cannot be directly updated. Deactivate first or create a new version.',
      );
    }

    // Validate new configuration if provided
    const newConfig = dto.configuration ?? policy.configuration;
    this.validateConfiguration(policy.policyType, newConfig);

    await policy.update({
      name: dto.name ?? policy.name,
      description: dto.description !== undefined ? dto.description : policy.description,
      configuration: newConfig,
      effectiveFrom: dto.effectiveFrom !== undefined ? dto.effectiveFrom : policy.effectiveFrom,
      effectiveTo: dto.effectiveTo !== undefined ? dto.effectiveTo : policy.effectiveTo,
      updatedBy: updatedBy ?? policy.updatedBy,
    });

    return policy;
  }

  // ==========================================
  // LIFECYCLE TRANSITIONS
  // ==========================================

  async activatePolicy(tenantId: string, policyId: string, dto?: ActivatePolicyDto, activatedBy?: string) {
    const policy = await this.findPolicyScoped(tenantId, policyId);
    this.assertTransition(policy.status, PolicyStatus.ACTIVE, 'activate');

    const effectiveFrom = dto?.effectiveFrom ?? policy.effectiveFrom ?? new Date().toISOString().split('T')[0];

    // Use a transaction for exclusive policy enforcement
    return this.sequelize.transaction(async (t: Transaction) => {
      // Enforce exclusivity: deactivate existing ACTIVE policy of same type (for exclusive types)
      if (EXCLUSIVE_POLICY_TYPES.has(policy.policyType)) {
        await this.policyModel.update(
          { status: PolicyStatus.INACTIVE, updatedBy: activatedBy ?? null },
          {
            where: {
              tenantId,
              policyType: policy.policyType,
              status: PolicyStatus.ACTIVE,
              id: { [Op.ne]: policyId },
            },
            transaction: t,
          },
        );
      }

      await policy.update(
        {
          status: PolicyStatus.ACTIVE,
          effectiveFrom,
          activatedBy: activatedBy ?? null,
          activatedAt: new Date(),
          updatedBy: activatedBy ?? null,
        },
        { transaction: t },
      );

      this.logger.log(`Policy ACTIVATED: ${policy.id} [${policy.policyType}] for tenant ${tenantId}`);
      return policy;
    });
  }

  async deactivatePolicy(tenantId: string, policyId: string, updatedBy?: string) {
    const policy = await this.findPolicyScoped(tenantId, policyId);
    this.assertTransition(policy.status, PolicyStatus.INACTIVE, 'deactivate');

    await policy.update({ status: PolicyStatus.INACTIVE, updatedBy: updatedBy ?? null });
    this.logger.log(`Policy DEACTIVATED: ${policy.id} [${policy.policyType}] for tenant ${tenantId}`);
    return policy;
  }

  async archivePolicy(tenantId: string, policyId: string, updatedBy?: string) {
    const policy = await this.findPolicyScoped(tenantId, policyId);
    this.assertTransition(policy.status, PolicyStatus.ARCHIVED, 'archive');

    await policy.update({ status: PolicyStatus.ARCHIVED, updatedBy: updatedBy ?? null });
    this.logger.log(`Policy ARCHIVED: ${policy.id} [${policy.policyType}] for tenant ${tenantId}`);
    return policy;
  }

  // ==========================================
  // DELETE (DRAFT only)
  // ==========================================

  async deletePolicy(tenantId: string, policyId: string) {
    const policy = await this.findPolicyScoped(tenantId, policyId);

    if (policy.status !== PolicyStatus.DRAFT) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        `Only DRAFT policies can be deleted. Current status: ${policy.status}. Use 'archive' instead.`,
      );
    }

    await policy.destroy();
    return { message: `Policy '${policy.name}' deleted successfully.` };
  }

  // ==========================================
  // VERSIONING
  // ==========================================

  /**
   * Get the version chain for a policy (from current back to original).
   */
  async getPolicyVersions(tenantId: string, policyId: string): Promise<OrganizationPolicy[]> {
    const root = await this.findPolicyScoped(tenantId, policyId);
    const chain: OrganizationPolicy[] = [root];

    // Walk backwards through previousVersionId
    let current = root;
    while (current.previousVersionId) {
      const prev = await this.policyModel.findOne({
        where: { id: current.previousVersionId, tenantId },
      });
      if (!prev) break;
      chain.push(prev);
      current = prev;
    }

    return chain;
  }

  /**
   * Create a new version of an existing policy.
   * The new version is created as DRAFT with version = current.version + 1.
   * The previous version remains in its current state.
   */
  async createNewVersion(
    tenantId: string,
    policyId: string,
    dto: CreateNewPolicyVersionDto,
    createdBy?: string,
  ): Promise<OrganizationPolicy> {
    const existing = await this.findPolicyScoped(tenantId, policyId);

    const newConfiguration = dto.configuration ?? existing.configuration;
    this.validateConfiguration(existing.policyType, newConfiguration);

    const newVersion = await this.policyModel.create({
      tenantId,
      policyType: existing.policyType,
      source: existing.source,
      name: dto.name,
      description: dto.description ?? null,
      configuration: newConfiguration,
      version: existing.version + 1,
      previousVersionId: existing.id,
      status: PolicyStatus.DRAFT,
      effectiveFrom: dto.effectiveFrom ?? null,
      effectiveTo: dto.effectiveTo ?? null,
      createdBy: createdBy ?? null,
      updatedBy: createdBy ?? null,
    });

    this.logger.log(
      `New version created: ${newVersion.id} (v${newVersion.version}) for policy ${policyId} tenant ${tenantId}`,
    );
    return newVersion;
  }
}
