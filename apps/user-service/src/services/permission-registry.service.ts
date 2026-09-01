import { Injectable, BadRequestException } from '@nestjs/common';
import { HRMSModuleKey, ModuleAction } from '@app/common';
import { TenantModelProviderService } from './tenant-model-provider.service';
import { Permission } from '../models';

export interface SystemPermissionDef {
  resource: string;
  action: string;
  description: string;
  moduleKey: HRMSModuleKey;
}

// System permissions definition across modules
export const SYSTEM_PERMISSIONS: SystemPermissionDef[] = [
  // DASHBOARD
  { resource: 'dashboard', action: ModuleAction.VIEW, description: 'View organization dashboard and analytics', moduleKey: HRMSModuleKey.DASHBOARD },

  // EMPLOYEE
  { resource: 'employee', action: ModuleAction.VIEW, description: 'View employee directory and details', moduleKey: HRMSModuleKey.EMPLOYEE },
  { resource: 'employee', action: ModuleAction.CREATE, description: 'Create new employee profiles', moduleKey: HRMSModuleKey.EMPLOYEE },
  { resource: 'employee', action: ModuleAction.EDIT, description: 'Update employee profiles and information', moduleKey: HRMSModuleKey.EMPLOYEE },
  { resource: 'employee', action: ModuleAction.DELETE, description: 'Deactivate or delete employee profiles', moduleKey: HRMSModuleKey.EMPLOYEE },
  { resource: 'employee', action: ModuleAction.EXPORT, description: 'Export employee data', moduleKey: HRMSModuleKey.EMPLOYEE },
  { resource: 'employee', action: ModuleAction.MANAGE, description: 'Full management of employee records', moduleKey: HRMSModuleKey.EMPLOYEE },

  // DEPARTMENTS
  { resource: 'departments', action: ModuleAction.VIEW, description: 'View department structure', moduleKey: HRMSModuleKey.DEPARTMENTS },
  { resource: 'departments', action: ModuleAction.CREATE, description: 'Create new departments', moduleKey: HRMSModuleKey.DEPARTMENTS },
  { resource: 'departments', action: ModuleAction.EDIT, description: 'Edit department details', moduleKey: HRMSModuleKey.DEPARTMENTS },
  { resource: 'departments', action: ModuleAction.DELETE, description: 'Delete departments', moduleKey: HRMSModuleKey.DEPARTMENTS },
  { resource: 'departments', action: ModuleAction.MANAGE, description: 'Manage departments and designations', moduleKey: HRMSModuleKey.DEPARTMENTS },

  // ATTENDANCE
  { resource: 'attendance', action: ModuleAction.VIEW, description: 'View employee attendance logs', moduleKey: HRMSModuleKey.ATTENDANCE },
  { resource: 'attendance', action: ModuleAction.CREATE, description: 'Mark or record attendance entries', moduleKey: HRMSModuleKey.ATTENDANCE },
  { resource: 'attendance', action: ModuleAction.EDIT, description: 'Edit or correct attendance entries', moduleKey: HRMSModuleKey.ATTENDANCE },
  { resource: 'attendance', action: ModuleAction.DELETE, description: 'Delete attendance entries', moduleKey: HRMSModuleKey.ATTENDANCE },
  { resource: 'attendance', action: ModuleAction.EXPORT, description: 'Export attendance logs and reports', moduleKey: HRMSModuleKey.ATTENDANCE },
  { resource: 'attendance', action: ModuleAction.MANAGE, description: 'Manage organization attendance policies', moduleKey: HRMSModuleKey.ATTENDANCE },

  // LEAVE MANAGEMENT
  { resource: 'leave_management', action: ModuleAction.VIEW, description: 'View leave requests and balances', moduleKey: HRMSModuleKey.LEAVE_MANAGEMENT },
  { resource: 'leave_management', action: ModuleAction.CREATE, description: 'Apply for or submit leave requests', moduleKey: HRMSModuleKey.LEAVE_MANAGEMENT },
  { resource: 'leave_management', action: ModuleAction.EDIT, description: 'Approve, reject, or edit leave requests', moduleKey: HRMSModuleKey.LEAVE_MANAGEMENT },
  { resource: 'leave_management', action: ModuleAction.DELETE, description: 'Cancel or delete leave requests', moduleKey: HRMSModuleKey.LEAVE_MANAGEMENT },
  { resource: 'leave_management', action: ModuleAction.MANAGE, description: 'Manage leave policies and types', moduleKey: HRMSModuleKey.LEAVE_MANAGEMENT },

  // PAYROLL
  { resource: 'payroll', action: ModuleAction.VIEW, description: 'View payroll records and payslips', moduleKey: HRMSModuleKey.PAYROLL },
  { resource: 'payroll', action: ModuleAction.CREATE, description: 'Generate payroll runs', moduleKey: HRMSModuleKey.PAYROLL },
  { resource: 'payroll', action: ModuleAction.EDIT, description: 'Edit payroll details and salary structures', moduleKey: HRMSModuleKey.PAYROLL },
  { resource: 'payroll', action: ModuleAction.DELETE, description: 'Cancel payroll runs', moduleKey: HRMSModuleKey.PAYROLL },
  { resource: 'payroll', action: ModuleAction.EXPORT, description: 'Export payroll summary reports', moduleKey: HRMSModuleKey.PAYROLL },
  { resource: 'payroll', action: ModuleAction.MANAGE, description: 'Manage payroll and tax configurations', moduleKey: HRMSModuleKey.PAYROLL },

  // REPORTS
  { resource: 'reports', action: ModuleAction.VIEW, description: 'View organizational reports', moduleKey: HRMSModuleKey.REPORTS },
  { resource: 'reports', action: ModuleAction.EXPORT, description: 'Export HR and financial reports', moduleKey: HRMSModuleKey.REPORTS },
  { resource: 'reports', action: ModuleAction.MANAGE, description: 'Create custom report definitions', moduleKey: HRMSModuleKey.REPORTS },

  // SETTINGS
  { resource: 'settings', action: ModuleAction.VIEW, description: 'View organization settings', moduleKey: HRMSModuleKey.SETTINGS },
  { resource: 'settings', action: ModuleAction.EDIT, description: 'Update organization profile and policies', moduleKey: HRMSModuleKey.SETTINGS },
  { resource: 'settings', action: ModuleAction.MANAGE, description: 'Manage all organization-level configurations', moduleKey: HRMSModuleKey.SETTINGS },

  // USER MANAGEMENT & ROLES
  { resource: 'user_management', action: ModuleAction.VIEW, description: 'View system users and assigned roles', moduleKey: HRMSModuleKey.USER_MANAGEMENT },
  { resource: 'user_management', action: ModuleAction.CREATE, description: 'Invite and create system users', moduleKey: HRMSModuleKey.USER_MANAGEMENT },
  { resource: 'user_management', action: ModuleAction.EDIT, description: 'Modify user accounts and status', moduleKey: HRMSModuleKey.USER_MANAGEMENT },
  { resource: 'user_management', action: ModuleAction.DELETE, description: 'Remove user accounts', moduleKey: HRMSModuleKey.USER_MANAGEMENT },
  { resource: 'user_management', action: ModuleAction.MANAGE, description: 'Manage roles, permissions, and access control', moduleKey: HRMSModuleKey.USER_MANAGEMENT },

  // PERFORMANCE
  { resource: 'performance', action: ModuleAction.VIEW, description: 'View performance appraisals and goals', moduleKey: HRMSModuleKey.PERFORMANCE },
  { resource: 'performance', action: ModuleAction.CREATE, description: 'Create performance reviews and goals', moduleKey: HRMSModuleKey.PERFORMANCE },
  { resource: 'performance', action: ModuleAction.EDIT, description: 'Update review cycles and goal status', moduleKey: HRMSModuleKey.PERFORMANCE },
  { resource: 'performance', action: ModuleAction.MANAGE, description: 'Manage performance review cycles', moduleKey: HRMSModuleKey.PERFORMANCE },

  // EXTENSIBLE FUTURE MODULES
  { resource: 'recruitment', action: ModuleAction.VIEW, description: 'View recruitment pipelines and candidates', moduleKey: HRMSModuleKey.RECRUITMENT },
  { resource: 'recruitment', action: ModuleAction.MANAGE, description: 'Manage job postings and candidate hiring', moduleKey: HRMSModuleKey.RECRUITMENT },

  { resource: 'projects', action: ModuleAction.VIEW, description: 'View organization projects', moduleKey: HRMSModuleKey.PROJECTS },
  { resource: 'projects', action: ModuleAction.MANAGE, description: 'Manage projects and assignments', moduleKey: HRMSModuleKey.PROJECTS },

  { resource: 'expenses', action: ModuleAction.VIEW, description: 'View expense claims', moduleKey: HRMSModuleKey.EXPENSES },
  { resource: 'expenses', action: ModuleAction.MANAGE, description: 'Approve and process expense claims', moduleKey: HRMSModuleKey.EXPENSES },

  { resource: 'assets', action: ModuleAction.VIEW, description: 'View company assets', moduleKey: HRMSModuleKey.ASSETS },
  { resource: 'assets', action: ModuleAction.MANAGE, description: 'Manage asset allocations', moduleKey: HRMSModuleKey.ASSETS },

  { resource: 'tickets', action: ModuleAction.VIEW, description: 'View support tickets', moduleKey: HRMSModuleKey.TICKETS },
  { resource: 'tickets', action: ModuleAction.MANAGE, description: 'Resolve and manage support tickets', moduleKey: HRMSModuleKey.TICKETS },
];

@Injectable()
export class PermissionRegistryService {
  constructor(private readonly modelProvider: TenantModelProviderService) {}

  /**
   * Seed standard system permissions into the active tenant database if missing
   */
  async seedStandardPermissions(): Promise<void> {
    const PermissionModel = await this.modelProvider.getPermissionModel();

    for (const def of SYSTEM_PERMISSIONS) {
      const existing = await PermissionModel.findOne({
        where: { resource: def.resource, action: def.action },
      });
      if (!existing) {
        await PermissionModel.create({
          resource: def.resource,
          action: def.action,
          description: def.description,
        });
      }
    }
  }

  /**
   * Retrieve permissions grouped by module/resource, filtered by enabled organization modules
   */
  async getAvailablePermissions(enabledModuleKeys?: string[]): Promise<Record<string, Array<{ id: string; key: string; resource: string; action: string; description: string }>>> {
    await this.seedStandardPermissions();
    const PermissionModel = await this.modelProvider.getPermissionModel();
    const allPermissions = await PermissionModel.findAll();

    const result: Record<string, Array<{ id: string; key: string; resource: string; action: string; description: string }>> = {};

    for (const perm of allPermissions) {
      // Find matching definition to determine moduleKey
      const match = SYSTEM_PERMISSIONS.find(
        (def) => def.resource === perm.resource && def.action === perm.action,
      );

      const moduleKey = match ? match.moduleKey : (perm.resource as HRMSModuleKey);

      // If enabledModuleKeys list is provided, filter out permissions belonging to disabled modules
      if (enabledModuleKeys && enabledModuleKeys.length > 0) {
        if (!enabledModuleKeys.includes(moduleKey)) {
          continue;
        }
      }

      if (!result[perm.resource]) {
        result[perm.resource] = [];
      }

      result[perm.resource].push({
        id: perm.id,
        key: `${perm.resource}.${perm.action}`,
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
      });
    }

    return result;
  }

  /**
   * Resolve and validate permission input array (accepting UUIDs or 'resource.action' keys)
   */
  async resolvePermissionIds(permissionInputs: string[]): Promise<string[]> {
    if (!permissionInputs || permissionInputs.length === 0) {
      return [];
    }

    await this.seedStandardPermissions();
    const PermissionModel = await this.modelProvider.getPermissionModel();
    const resolvedIds: string[] = [];

    for (const input of permissionInputs) {
      let perm: Permission | null = null;

      // Check if UUID
      if (input.includes('-') && input.length === 36) {
        perm = await PermissionModel.findByPk(input);
      }

      // If not UUID or not found by PK, search by key 'resource.action' or 'resource:action'
      if (!perm) {
        const parts = input.split(/[.:]/);
        if (parts.length === 2) {
          const [resource, action] = parts;
          perm = await PermissionModel.findOne({ where: { resource, action } });
        }
      }

      if (!perm) {
        throw new BadRequestException(`Invalid or unknown permission key/ID: '${input}'`);
      }

      // Check for platform-level permission attempt
      if (perm.resource.startsWith('platform.') || perm.resource.startsWith('superadmin.')) {
        throw new BadRequestException(`Organization Admins cannot assign platform-level permissions.`);
      }

      if (!resolvedIds.includes(perm.id)) {
        resolvedIds.push(perm.id);
      }
    }

    return resolvedIds;
  }
}
