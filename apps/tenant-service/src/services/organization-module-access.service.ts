import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ConfigureModuleAccessDto, HRMSModuleKey, ModuleAction } from '@app/common';
import { OrganizationModuleAccess } from '../models/organization-module-access.model';

const DEFAULT_MODULES: ConfigureModuleAccessDto[] = [
  { moduleKey: HRMSModuleKey.DASHBOARD, enabled: true, allowedActions: [ModuleAction.ALL] },
  { moduleKey: HRMSModuleKey.EMPLOYEE, enabled: true, allowedActions: [ModuleAction.ALL] },
  { moduleKey: HRMSModuleKey.DEPARTMENTS, enabled: true, allowedActions: [ModuleAction.ALL] },
  { moduleKey: HRMSModuleKey.ATTENDANCE, enabled: true, allowedActions: [ModuleAction.ALL] },
  { moduleKey: HRMSModuleKey.LEAVE_MANAGEMENT, enabled: true, allowedActions: [ModuleAction.ALL] },
  { moduleKey: HRMSModuleKey.PAYROLL, enabled: true, allowedActions: [ModuleAction.ALL] },
  { moduleKey: HRMSModuleKey.REPORTS, enabled: true, allowedActions: [ModuleAction.ALL] },
  { moduleKey: HRMSModuleKey.SETTINGS, enabled: true, allowedActions: [ModuleAction.ALL] },
  { moduleKey: HRMSModuleKey.USER_MANAGEMENT, enabled: true, allowedActions: [ModuleAction.ALL] },
  { moduleKey: HRMSModuleKey.PERFORMANCE, enabled: true, allowedActions: [ModuleAction.ALL] },
];

@Injectable()
export class OrganizationModuleAccessService {
  private readonly logger = new Logger(OrganizationModuleAccessService.name);

  constructor(
    @InjectModel(OrganizationModuleAccess)
    private moduleAccessModel: typeof OrganizationModuleAccess,
  ) {}

  /**
   * Set or update organization module access configuration
   */
  async setOrganizationModules(
    tenantId: string,
    modules: ConfigureModuleAccessDto[],
  ): Promise<OrganizationModuleAccess[]> {
    const results: OrganizationModuleAccess[] = [];

    const modulesToSave = modules && modules.length > 0 ? modules : DEFAULT_MODULES;

    for (const mod of modulesToSave) {
      const [record] = await this.moduleAccessModel.upsert(
        {
          tenantId,
          moduleKey: mod.moduleKey.toLowerCase(),
          enabled: mod.enabled,
          allowedActions: mod.allowedActions || [ModuleAction.ALL],
        },
        {
          returning: true,
        },
      );
      results.push(record);
    }

    this.logger.log(`Saved ${results.length} module access rules for tenant ${tenantId}`);
    return results;
  }

  /**
   * Retrieve configured module access list for a tenant
   */
  async getOrganizationModules(tenantId: string): Promise<OrganizationModuleAccess[]> {
    const existing = await this.moduleAccessModel.findAll({
      where: { tenantId },
      order: [['moduleKey', 'ASC']],
    });

    if (existing && existing.length > 0) {
      return existing;
    }

    // If no explicit config exists yet, initialize with default active modules
    return this.setOrganizationModules(tenantId, DEFAULT_MODULES);
  }

  /**
   * Check if a specific module is enabled for a tenant, and optionally check action permission
   */
  async isModuleEnabled(
    tenantId: string,
    moduleKey: string,
    action?: string,
  ): Promise<{ enabled: boolean; allowed: boolean; reason?: string }> {
    const key = moduleKey.toLowerCase();
    const record = await this.moduleAccessModel.findOne({
      where: { tenantId, moduleKey: key },
    });

    if (!record) {
      // Check default fallback: if module is in default list, enable by default
      const defaultMod = DEFAULT_MODULES.find((m) => m.moduleKey === key);
      if (defaultMod) {
        return { enabled: defaultMod.enabled, allowed: true };
      }
      return {
        enabled: false,
        allowed: false,
        reason: `Module '${moduleKey}' is not configured or enabled for this organization.`,
      };
    }

    if (!record.enabled) {
      return {
        enabled: false,
        allowed: false,
        reason: `Module '${moduleKey}' is disabled for this organization.`,
      };
    }

    if (action) {
      const actions = record.allowedActions || [];
      const hasAction =
        actions.includes(ModuleAction.ALL) ||
        actions.includes(action.toLowerCase()) ||
        actions.includes(action);

      if (!hasAction) {
        return {
          enabled: true,
          allowed: false,
          reason: `Action '${action}' is not allowed for module '${moduleKey}' in this organization.`,
        };
      }
    }

    return { enabled: true, allowed: true };
  }
}
