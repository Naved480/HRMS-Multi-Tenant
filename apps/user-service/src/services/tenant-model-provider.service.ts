import { Injectable, Scope, BadRequestException } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import {
  TenantRequestContextService,
  TenantConnectionManager,
} from '@app/tenant-context';
import {
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
} from '../models';

@Injectable({ scope: Scope.REQUEST })
export class TenantModelProviderService {
  private connection?: Sequelize;

  constructor(
    private readonly requestContext: TenantRequestContextService,
    private readonly connectionManager: TenantConnectionManager,
  ) {}

  /**
   * Resolve and get the active Sequelize connection for the current request's tenant
   */
  async getConnection(): Promise<Sequelize> {
    if (this.connection) {
      return this.connection;
    }

    const options = this.requestContext.getConnectionOptions();
    if (!options) {
      throw new BadRequestException(
        'Missing tenant context or connection options for current request. Please pass x-tenant-id header.',
      );
    }

    const connection = await this.connectionManager.getConnection(options);
    connection.addModels([User, Role, Permission, UserRole, RolePermission]);
    this.connection = connection;
    return this.connection;
  }

  /**
   * Get tenant-scoped User model
   */
  async getUserModel(): Promise<typeof User> {
    const connection = await this.getConnection();
    return connection.models.User as typeof User;
  }

  /**
   * Get tenant-scoped Role model
   */
  async getRoleModel(): Promise<typeof Role> {
    const connection = await this.getConnection();
    return connection.models.Role as typeof Role;
  }

  /**
   * Get tenant-scoped Permission model
   */
  async getPermissionModel(): Promise<typeof Permission> {
    const connection = await this.getConnection();
    return connection.models.Permission as typeof Permission;
  }

  /**
   * Get tenant-scoped UserRole join model
   */
  async getUserRoleModel(): Promise<typeof UserRole> {
    const connection = await this.getConnection();
    return connection.models.UserRole as typeof UserRole;
  }

  /**
   * Get tenant-scoped RolePermission join model
   */
  async getRolePermissionModel(): Promise<typeof RolePermission> {
    const connection = await this.getConnection();
    return connection.models.RolePermission as typeof RolePermission;
  }
}
