import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TenantModelProviderService } from './tenant-model-provider.service';
import { PermissionRegistryService } from './permission-registry.service';
import { Role } from '../models';

export interface CreateRoleData {
  name: string;
  description?: string;
  isSystemRole?: boolean;
  permissionIds?: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
}

const PROTECTED_SYSTEM_ROLES = [
  'ORGANIZATION_ADMIN',
  'ADMIN',
  'HR MANAGER',
  'MANAGER',
  'EMPLOYEE',
];

@Injectable()
export class RoleService {
  constructor(
    private readonly modelProvider: TenantModelProviderService,
    private readonly permissionRegistryService: PermissionRegistryService,
  ) {}

  /**
   * Create a role in the current tenant database
   */
  async createRole(data: CreateRoleData): Promise<Role> {
    const RoleModel = await this.modelProvider.getRoleModel();
    const existing = await RoleModel.findOne({ where: { name: data.name } });
    if (existing) {
      throw new BadRequestException(`Role '${data.name}' already exists in this organization`);
    }

    const role = await RoleModel.create({
      name: data.name,
      description: data.description,
      isSystemRole: data.isSystemRole ?? false,
    });

    if (data.permissionIds && data.permissionIds.length > 0) {
      const resolvedIds = await this.permissionRegistryService.resolvePermissionIds(data.permissionIds);
      const RolePermissionModel = await this.modelProvider.getRolePermissionModel();
      for (const pId of resolvedIds) {
        await RolePermissionModel.create({
          roleId: role.id,
          permissionId: pId,
        });
      }
    }

    return this.getRoleById(role.id);
  }

  /**
   * Get role by ID with associated permissions
   */
  async getRoleById(id: string): Promise<Role> {
    const RoleModel = await this.modelProvider.getRoleModel();
    const PermissionModel = await this.modelProvider.getPermissionModel();
    const role = await RoleModel.findByPk(id, {
      include: [
        {
          model: PermissionModel,
          through: { attributes: [] },
        },
      ],
    });

    if (!role) {
      throw new NotFoundException(`Role ${id} not found in tenant database`);
    }

    return role;
  }

  /**
   * Get all roles in the current tenant database
   */
  async getAllRoles(): Promise<Role[]> {
    const RoleModel = await this.modelProvider.getRoleModel();
    const PermissionModel = await this.modelProvider.getPermissionModel();
    return RoleModel.findAll({
      include: [
        {
          model: PermissionModel,
          through: { attributes: [] },
        },
      ],
    });
  }

  /**
   * Update role
   */
  async updateRole(id: string, data: UpdateRoleData): Promise<Role> {
    const role = await this.getRoleById(id);
    if (role.isSystemRole || PROTECTED_SYSTEM_ROLES.includes(role.name.toUpperCase())) {
      throw new BadRequestException(`System role '${role.name}' cannot be modified`);
    }
    await role.update(data);
    return this.getRoleById(id);
  }

  /**
   * Delete role with active assignment check
   */
  async deleteRole(id: string): Promise<void> {
    const role = await this.getRoleById(id);
    if (role.isSystemRole || PROTECTED_SYSTEM_ROLES.includes(role.name.toUpperCase())) {
      throw new BadRequestException(`System role '${role.name}' cannot be deleted`);
    }

    const UserRoleModel = await this.modelProvider.getUserRoleModel();
    const assignedUserCount = await UserRoleModel.count({ where: { roleId: id } });
    if (assignedUserCount > 0) {
      throw new BadRequestException(
        `Cannot delete role '${role.name}' because ${assignedUserCount} user(s) are currently assigned to it. Reassign users first.`,
      );
    }

    const RolePermissionModel = await this.modelProvider.getRolePermissionModel();
    await RolePermissionModel.destroy({ where: { roleId: id } });
    await role.destroy();
  }

  /**
   * Assign a permission to a role
   */
  async assignPermission(roleId: string, permissionInput: string): Promise<void> {
    await this.getRoleById(roleId);
    const resolvedIds = await this.permissionRegistryService.resolvePermissionIds([permissionInput]);
    const permissionId = resolvedIds[0];

    const RolePermissionModel = await this.modelProvider.getRolePermissionModel();
    const existing = await RolePermissionModel.findOne({
      where: { roleId, permissionId },
    });

    if (!existing) {
      await RolePermissionModel.create({ roleId, permissionId });
    }
  }

  /**
   * Revoke a permission from a role
   */
  async revokePermission(roleId: string, permissionInput: string): Promise<void> {
    await this.getRoleById(roleId);
    const resolvedIds = await this.permissionRegistryService.resolvePermissionIds([permissionInput]);
    const permissionId = resolvedIds[0];

    const RolePermissionModel = await this.modelProvider.getRolePermissionModel();
    await RolePermissionModel.destroy({
      where: { roleId, permissionId },
    });
  }

  /**
   * Transaction-safe replace/set of all permissions for a role
   */
  async setRolePermissions(roleId: string, permissionInputs: string[]): Promise<Role> {
    const role = await this.getRoleById(roleId);
    const resolvedPermissionIds = await this.permissionRegistryService.resolvePermissionIds(permissionInputs);

    const sequelize = await this.modelProvider.getConnection();
    const transaction = await sequelize.transaction();

    try {
      const RolePermissionModel = await this.modelProvider.getRolePermissionModel();

      // Clear current permissions
      await RolePermissionModel.destroy({ where: { roleId }, transaction });

      // Bulk create new permissions
      for (const pId of resolvedPermissionIds) {
        await RolePermissionModel.create({ roleId, permissionId: pId }, { transaction });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    return this.getRoleById(roleId);
  }
}
