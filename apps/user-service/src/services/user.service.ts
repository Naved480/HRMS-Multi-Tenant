import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TenantModelProviderService } from './tenant-model-provider.service';
import { User, Role } from '../models';

export interface CreateUserData {
  email: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  roleIds?: string[];
  isActive?: boolean;
}

export interface UpdateUserData {
  email?: string;
  passwordHash?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

@Injectable()
export class UserService {
  constructor(
    private readonly modelProvider: TenantModelProviderService,
  ) {}

  /**
   * Create a user in the current tenant database
   */
  async createUser(data: CreateUserData): Promise<User> {
    const UserModel = await this.modelProvider.getUserModel();
    const existing = await UserModel.findOne({ where: { email: data.email } });
    if (existing) {
      throw new BadRequestException(`User with email ${data.email} already exists`);
    }

    const user = await UserModel.create({
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      isActive: data.isActive ?? true,
    });

    const roleIds = data.roleIds || (data.roleId ? [data.roleId] : []);
    if (roleIds.length > 0) {
      const UserRoleModel = await this.modelProvider.getUserRoleModel();
      for (const rId of roleIds) {
        await UserRoleModel.create({
          userId: user.id,
          roleId: rId,
        });
      }
    }

    return this.getUserById(user.id);
  }

  /**
   * Get user by ID with associated roles
   */
  async getUserById(id: string): Promise<User> {
    const UserModel = await this.modelProvider.getUserModel();
    const RoleModel = await this.modelProvider.getRoleModel();
    const user = await UserModel.findByPk(id, {
      include: [
        {
          model: RoleModel,
          through: { attributes: [] },
        },
      ],
    });

    if (!user) {
      throw new NotFoundException(`User ${id} not found in tenant database`);
    }

    return user;
  }

  /**
   * Get all users in the current tenant database
   */
  async getAllUsers(): Promise<User[]> {
    const UserModel = await this.modelProvider.getUserModel();
    const RoleModel = await this.modelProvider.getRoleModel();
    return UserModel.findAll({
      include: [
        {
          model: RoleModel,
          through: { attributes: [] },
        },
      ],
    });
  }

  /**
   * Update a user in the current tenant database
   */
  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const user = await this.getUserById(id);
    await user.update(data);
    return this.getUserById(id);
  }

  /**
   * Delete a user from the current tenant database
   */
  async deleteUser(id: string): Promise<void> {
    const user = await this.getUserById(id);
    const UserRoleModel = await this.modelProvider.getUserRoleModel();
    await UserRoleModel.destroy({ where: { userId: id } });
    await user.destroy();
  }

  /**
   * Assign a role to a user
   */
  async assignRole(userId: string, roleId: string): Promise<void> {
    await this.getUserById(userId);
    const RoleModel = await this.modelProvider.getRoleModel();
    const role = await RoleModel.findByPk(roleId);
    if (!role) {
      throw new NotFoundException(`Role ${roleId} not found`);
    }

    const UserRoleModel = await this.modelProvider.getUserRoleModel();
    const existing = await UserRoleModel.findOne({ where: { userId, roleId } });
    if (!existing) {
      await UserRoleModel.create({ userId, roleId });
    }
  }

  /**
   * Revoke a role from a user
   */
  async revokeRole(userId: string, roleId: string): Promise<void> {
    await this.getUserById(userId);
    const UserRoleModel = await this.modelProvider.getUserRoleModel();
    await UserRoleModel.destroy({ where: { userId, roleId } });
  }
}
