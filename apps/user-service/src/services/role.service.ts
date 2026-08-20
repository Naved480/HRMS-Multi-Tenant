import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TenantModelProviderService } from './tenant-model-provider.service';
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

@Injectable()
export class RoleService {
  constructor(
    private readonly modelProvider: TenantModelProviderService,
  ) {}

  /**
   * Create a role in the current tenant database
   */
  async createRole(data: CreateRoleData): Promise<Role> {
    const RoleModel = await this.modelProvider.getRoleModel();
    const existing = await RoleModel.findOne({ where: { name: data.name } });
    if (existing) {
      throw new BadRequestException(`Role ${data.name} already exists`);
    }

    const role = await RoleModel.create({
      name: data.name,
      description: data.description,
      isSystemRole: data.isSystemRole ?? false,
    });

    if (data.permissionIds && data.permissionIds.length > 0) {
      const RolePermissionModel = await this.modelProvider.getRolePermissionModel();
      for (const pId of data.permissionIds) {
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
    if (role.isSystemRole) {
      throw new BadRequestException(`System role ${role.name} cannot be modified`);
    }
    await role.update(data);
    return this.getRoleById(id);
  }

  /**
   * Delete role
   */
  async deleteRole(id: string): Promise<void> {
    const role = await this.getRoleById(id);
    if (role.isSystemRole) {
      throw new BadRequestException(`System role ${role.name} cannot be deleted`);
    }
    const RolePermissionModel = await this.modelProvider.getRolePermissionModel();
    const UserRoleModel = await this.modelProvider.getUserRoleModel();

    await RolePermissionModel.destroy({ where: { roleId: id } });
    await UserRoleModel.destroy({ where: { roleId: id } });
    await role.destroy();
  }

  /**
   * Assign a permission to a role
   */
  async assignPermission(roleId: string, permissionId: string): Promise<void> {
    await this.getRoleById(roleId);
    const PermissionModel = await this.modelProvider.getPermissionModel();
    const permission = await PermissionModel.findByPk(permissionId);
    if (!permission) {
      throw new NotFoundException(`Permission ${permissionId} not found`);
    }

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
  async revokePermission(roleId: string, permissionId: string): Promise<void> {
    await this.getRoleById(roleId);
    const RolePermissionModel = await this.modelProvider.getRolePermissionModel();
    await RolePermissionModel.destroy({
      where: { roleId, permissionId },
    });
  }
}
