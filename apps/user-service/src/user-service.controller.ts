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
import { PermissionRegistryService } from './services/permission-registry.service';

@Controller()
@UseGuards(TenantGuard, RolesGuard, PermissionsGuard)
export class UserServiceController {
  constructor(
    private readonly userService: UserService,
    private readonly roleService: RoleService,
    private readonly permissionRegistryService: PermissionRegistryService,
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
  // MICROSERVICE MESSAGE PATTERN HANDLERS
  // ==========================================

  @MessagePattern(MESSAGE_PATTERNS.ROLE.GET_ALL)
  async handleGetAllRoles() {
    return this.roleService.getAllRoles();
  }

  @MessagePattern(MESSAGE_PATTERNS.ROLE.GET_BY_ID)
  async handleGetRoleById(@Payload() payload: { id: string }) {
    return this.roleService.getRoleById(payload.id);
  }

  @MessagePattern(MESSAGE_PATTERNS.ROLE.CREATE)
  async handleCreateRole(@Payload() data: CreateRoleData) {
    return this.roleService.createRole(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.ROLE.UPDATE)
  async handleUpdateRole(@Payload() payload: { id: string; data: UpdateRoleData }) {
    return this.roleService.updateRole(payload.id, payload.data);
  }

  @MessagePattern(MESSAGE_PATTERNS.ROLE.DELETE)
  async handleDeleteRole(@Payload() payload: { id: string }) {
    await this.roleService.deleteRole(payload.id);
    return { message: `Role ${payload.id} deleted successfully` };
  }

  @MessagePattern(MESSAGE_PATTERNS.ROLE.ASSIGN_PERMISSION)
  async handleAssignPermission(@Payload() payload: { roleId: string; permissionId: string }) {
    await this.roleService.assignPermission(payload.roleId, payload.permissionId);
    return { message: `Permission assigned to role successfully` };
  }

  @MessagePattern(MESSAGE_PATTERNS.ROLE.REVOKE_PERMISSION)
  async handleRevokePermission(@Payload() payload: { roleId: string; permissionId: string }) {
    await this.roleService.revokePermission(payload.roleId, payload.permissionId);
    return { message: `Permission revoked from role successfully` };
  }

  @MessagePattern(MESSAGE_PATTERNS.ROLE.SET_PERMISSIONS)
  async handleSetRolePermissions(@Payload() payload: { roleId: string; permissionIds: string[] }) {
    return this.roleService.setRolePermissions(payload.roleId, payload.permissionIds);
  }

  @MessagePattern(MESSAGE_PATTERNS.PERMISSION.GET_AVAILABLE)
  async handleGetAvailablePermissions(@Payload() payload?: { enabledModules?: string[] }) {
    return this.permissionRegistryService.getAvailablePermissions(payload?.enabledModules);
  }

  @MessagePattern(MESSAGE_PATTERNS.USER.GET_ALL)
  async handleGetAllUsers() {
    return this.userService.getAllUsers();
  }

  @MessagePattern(MESSAGE_PATTERNS.USER.GET_USER)
  async handleGetUserById(@Payload() payload: { id: string }) {
    return this.userService.getUserById(payload.id);
  }

  @MessagePattern(MESSAGE_PATTERNS.USER.CREATE_USER)
  async handleCreateUser(@Payload() data: CreateUserData) {
    return this.userService.createUser(data);
  }

  @MessagePattern(MESSAGE_PATTERNS.USER.UPDATE_USER)
  async handleUpdateUser(@Payload() payload: { id: string; data: UpdateUserData }) {
    return this.userService.updateUser(payload.id, payload.data);
  }

  @MessagePattern(MESSAGE_PATTERNS.USER.DELETE_USER)
  async handleDeleteUser(@Payload() payload: { id: string }) {
    await this.userService.deleteUser(payload.id);
    return { message: `User ${payload.id} deleted successfully` };
  }

  @MessagePattern(MESSAGE_PATTERNS.USER.ASSIGN_ROLE)
  async handleAssignUserRole(@Payload() payload: { userId: string; roleId: string }) {
    await this.userService.assignRole(payload.userId, payload.roleId);
    return { message: `Role assigned to user successfully` };
  }

  @MessagePattern(MESSAGE_PATTERNS.USER.REVOKE_ROLE)
  async handleRevokeUserRole(@Payload() payload: { userId: string; roleId: string }) {
    await this.userService.revokeRole(payload.userId, payload.roleId);
    return { message: `Role revoked from user successfully` };
  }

  @MessagePattern(MESSAGE_PATTERNS.USER.SET_ROLES)
  async handleSetUserRoles(@Payload() payload: { userId: string; roleIds: string[] }) {
    return this.userService.setUserRoles(payload.userId, payload.roleIds);
  }

  // ==========================================
  // DIRECT HTTP ENDPOINTS
  // ==========================================

  @Post('users')
  @RequirePermissions('users:write', 'user_management.create')
  async createUser(@Body() data: CreateUserData) {
    return this.userService.createUser(data);
  }

  @Get('users')
  @RequirePermissions('users:read', 'user_management.view')
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get('users/:id')
  @RequirePermissions('users:read', 'user_management.view')
  async getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Patch('users/:id')
  @RequirePermissions('users:write', 'user_management.edit')
  async updateUser(@Param('id') id: string, @Body() data: UpdateUserData) {
    return this.userService.updateUser(id, data);
  }

  @Delete('users/:id')
  @RequirePermissions('users:write', 'user_management.delete')
  async deleteUser(@Param('id') id: string) {
    await this.userService.deleteUser(id);
    return { message: `User ${id} deleted successfully` };
  }

  @Post('users/:id/roles')
  @RequirePermissions('users:write', 'user_management.manage')
  async assignRoleToUser(
    @Param('id') id: string,
    @Body('roleId') roleId: string,
  ) {
    await this.userService.assignRole(id, roleId);
    return { message: `Role ${roleId} assigned to user ${id}` };
  }

  @Delete('users/:id/roles/:roleId')
  @RequirePermissions('users:write', 'user_management.manage')
  async revokeRoleFromUser(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
  ) {
    await this.userService.revokeRole(id, roleId);
    return { message: `Role ${roleId} revoked from user ${id}` };
  }

  @Post('roles')
  @Roles('admin', 'ORGANIZATION_ADMIN')
  async createRole(@Body() data: CreateRoleData) {
    return this.roleService.createRole(data);
  }

  @Get('roles')
  @RequirePermissions('roles:read', 'user_management.view')
  async getAllRoles() {
    return this.roleService.getAllRoles();
  }

  @Get('roles/:id')
  @RequirePermissions('roles:read', 'user_management.view')
  async getRoleById(@Param('id') id: string) {
    return this.roleService.getRoleById(id);
  }

  @Patch('roles/:id')
  @Roles('admin', 'ORGANIZATION_ADMIN')
  async updateRole(@Param('id') id: string, @Body() data: UpdateRoleData) {
    return this.roleService.updateRole(id, data);
  }

  @Delete('roles/:id')
  @Roles('admin', 'ORGANIZATION_ADMIN')
  async deleteRole(@Param('id') id: string) {
    await this.roleService.deleteRole(id);
    return { message: `Role ${id} deleted successfully` };
  }

  @Post('roles/:id/permissions')
  @Roles('admin', 'ORGANIZATION_ADMIN')
  async assignPermissionToRole(
    @Param('id') id: string,
    @Body('permissionId') permissionId: string,
  ) {
    await this.roleService.assignPermission(id, permissionId);
    return { message: `Permission ${permissionId} assigned to role ${id}` };
  }

  @Delete('roles/:id/permissions/:permissionId')
  @Roles('admin', 'ORGANIZATION_ADMIN')
  async revokePermissionFromRole(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
  ) {
    await this.roleService.revokePermission(id, permissionId);
    return { message: `Permission ${permissionId} revoked from role ${id}` };
  }
}
