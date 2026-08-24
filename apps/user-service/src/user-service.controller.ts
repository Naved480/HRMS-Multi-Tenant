import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MESSAGE_PATTERNS, Public } from '@app/common';
import {
  TenantGuard,
  RolesGuard,
  PermissionsGuard,
  Roles,
  RequirePermissions,
} from '@app/tenant-context';
import { UserService, CreateUserData, UpdateUserData } from './services/user.service';
import { RoleService, CreateRoleData, UpdateRoleData } from './services/role.service';

@Controller()
@UseGuards(TenantGuard, RolesGuard, PermissionsGuard)
export class UserServiceController {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
  ) {}

  @MessagePattern(MESSAGE_PATTERNS.HEALTH.CHECK)
  @Public()
  healthCheck() {
    return { service: 'user-service', status: 'up', timestamp: new Date().toISOString() };
  }

  @MessagePattern(MESSAGE_PATTERNS.USER.CREATE_ORGANIZATION_ADMIN)
  @Public()
  async createOrganizationAdminMessage(
    @Payload() data: { tenantId: string; email: string; firstName?: string; lastName?: string },
  ) {
    return this.userService.createOrganizationAdminUser(data);
  }

  // ==========================================
  // USERS ENDPOINTS
  // ==========================================

  @Post('users')
  @RequirePermissions('users:write')
  async createUser(@Body() data: CreateUserData) {
    return this.userService.createUser(data);
  }

  @Get('users')
  @RequirePermissions('users:read')
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get('users/:id')
  @RequirePermissions('users:read')
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Patch('users/:id')
  @RequirePermissions('users:write')
  async updateUser(@Param('id') id: string, @Body() data: UpdateUserData) {
    return this.userService.updateUser(id, data);
  }

  @Delete('users/:id')
  @RequirePermissions('users:write')
  async deleteUser(@Param('id') id: string) {
    await this.userService.deleteUser(id);
    return { message: `User ${id} deleted successfully` };
  }

  @Post('users/:id/roles')
  @RequirePermissions('users:write')
  async assignRoleToUser(
    @Param('id') id: string,
    @Body('roleId') roleId: string,
  ) {
    await this.userService.assignRole(id, roleId);
    return { message: `Role ${roleId} assigned to user ${id}` };
  }

  @Delete('users/:id/roles/:roleId')
  @RequirePermissions('users:write')
  async revokeRoleFromUser(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
  ) {
    await this.userService.revokeRole(id, roleId);
    return { message: `Role ${roleId} revoked from user ${id}` };
  }

  // ==========================================
  // ROLES ENDPOINTS
  // ==========================================

  @Post('roles')
  @Roles('admin')
  async createRole(@Body() data: CreateRoleData) {
    return this.roleService.createRole(data);
  }

  @Get('roles')
  @RequirePermissions('roles:read')
  async getAllRoles() {
    return this.roleService.getAllRoles();
  }

  @Get('roles/:id')
  @RequirePermissions('roles:read')
  async getRoleById(@Param('id') id: string) {
    return this.roleService.getRoleById(id);
  }

  @Patch('roles/:id')
  @Roles('admin')
  async updateRole(@Param('id') id: string, @Body() data: UpdateRoleData) {
    return this.roleService.updateRole(id, data);
  }

  @Delete('roles/:id')
  @Roles('admin')
  async deleteRole(@Param('id') id: string) {
    await this.roleService.deleteRole(id);
    return { message: `Role ${id} deleted successfully` };
  }

  @Post('roles/:id/permissions')
  @Roles('admin')
  async assignPermissionToRole(
    @Param('id') id: string,
    @Body('permissionId') permissionId: string,
  ) {
    await this.roleService.assignPermission(id, permissionId);
    return { message: `Permission ${permissionId} assigned to role ${id}` };
  }

  @Delete('roles/:id/permissions/:permissionId')
  @Roles('admin')
  async revokePermissionFromRole(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ) {
    await this.roleService.revokePermission(id, permissionId);
    return { message: `Permission ${permissionId} revoked from role ${id}` };
  }
}
