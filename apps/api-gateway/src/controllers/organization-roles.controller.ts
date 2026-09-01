import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
  Body,
  Param,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ApiTags, ApiOperation, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import {
  SERVICES,
  MESSAGE_PATTERNS,
  HRMSModuleKey,
  ModuleAction,
  CreateOrgRoleDto,
  UpdateOrgRoleDto,
  AssignRolePermissionsDto,
  AssignUserRolesDto,
} from '@app/common';
import {
  TenantGuard,
  RolesGuard,
  PermissionsGuard,
  OrganizationModuleGuard,
  RequireModule,
  RequirePermissions,
} from '@app/tenant-context';

@ApiTags('Organization Role & Permission Management')
@Controller('organization')
@ApiBearerAuth()
@UseGuards(TenantGuard, OrganizationModuleGuard, RolesGuard, PermissionsGuard)
@ApiHeader({ name: 'x-tenant-id', description: 'Target Organization Tenant ID', required: true })
export class OrganizationRolesController {
  constructor(
    @Inject(SERVICES.USER_SERVICE) private readonly userClient: ClientProxy,
    @Inject(SERVICES.TENANT_SERVICE) private readonly tenantClient: ClientProxy,
  ) {}

  @Get('permissions')
  @RequireModule(HRMSModuleKey.USER_MANAGEMENT, ModuleAction.VIEW)
  @RequirePermissions('user_management.view', 'user_management.manage')
  @ApiOperation({ summary: 'Get available permissions grouped by module, filtered by organization module access' })
  async getAvailablePermissions() {
    return firstValueFrom(
      this.userClient
        .send(MESSAGE_PATTERNS.PERMISSION.GET_AVAILABLE, {})
        .pipe(timeout(5000)),
    );
  }

  @Get('roles')
  @RequireModule(HRMSModuleKey.USER_MANAGEMENT, ModuleAction.VIEW)
  @RequirePermissions('user_management.view', 'user_management.manage')
  @ApiOperation({ summary: 'Get all roles defined for current organization' })
  async getAllRoles() {
    return firstValueFrom(
      this.userClient
        .send(MESSAGE_PATTERNS.ROLE.GET_ALL, {})
        .pipe(timeout(5000)),
    );
  }

  @Get('roles/:id')
  @RequireModule(HRMSModuleKey.USER_MANAGEMENT, ModuleAction.VIEW)
  @RequirePermissions('user_management.view', 'user_management.manage')
  @ApiOperation({ summary: 'Get specific role by ID with permissions' })
  async getRoleById(@Param('id') id: string) {
    return firstValueFrom(
      this.userClient
        .send(MESSAGE_PATTERNS.ROLE.GET_BY_ID, { id })
        .pipe(timeout(5000)),
    );
  }

  @Post('roles')
  @RequireModule(HRMSModuleKey.USER_MANAGEMENT, ModuleAction.CREATE)
  @RequirePermissions('user_management.manage')
  @ApiOperation({ summary: 'Create custom role for organization' })
  async createRole(@Body() dto: CreateOrgRoleDto) {
    return firstValueFrom(
      this.userClient
        .send(MESSAGE_PATTERNS.ROLE.CREATE, dto)
        .pipe(timeout(5000)),
    );
  }

  @Patch('roles/:id')
  @RequireModule(HRMSModuleKey.USER_MANAGEMENT, ModuleAction.EDIT)
  @RequirePermissions('user_management.manage')
  @ApiOperation({ summary: 'Update custom role name and description' })
  async updateRole(@Param('id') id: string, @Body() dto: UpdateOrgRoleDto) {
    return firstValueFrom(
      this.userClient
        .send(MESSAGE_PATTERNS.ROLE.UPDATE, { id, data: dto })
        .pipe(timeout(5000)),
    );
  }

  @Delete('roles/:id')
  @RequireModule(HRMSModuleKey.USER_MANAGEMENT, ModuleAction.DELETE)
  @RequirePermissions('user_management.manage')
  @ApiOperation({ summary: 'Delete custom role (if no users assigned)' })
  async deleteRole(@Param('id') id: string) {
    return firstValueFrom(
      this.userClient
        .send(MESSAGE_PATTERNS.ROLE.DELETE, { id })
        .pipe(timeout(5000)),
    );
  }

  @Get('roles/:roleId/permissions')
  @RequireModule(HRMSModuleKey.USER_MANAGEMENT, ModuleAction.VIEW)
  @RequirePermissions('user_management.view', 'user_management.manage')
  @ApiOperation({ summary: 'Get permissions assigned to a role' })
  async getRolePermissions(@Param('roleId') roleId: string) {
    const role = await firstValueFrom(
      this.userClient
        .send(MESSAGE_PATTERNS.ROLE.GET_BY_ID, { id: roleId })
        .pipe(timeout(5000)),
    );
    return role?.permissions || [];
  }

  @Put('roles/:roleId/permissions')
  @RequireModule(HRMSModuleKey.USER_MANAGEMENT, ModuleAction.MANAGE)
  @RequirePermissions('user_management.manage')
  @ApiOperation({ summary: 'Assign / replace permissions for a role' })
  async setRolePermissions(
    @Param('roleId') roleId: string,
    @Body() dto: AssignRolePermissionsDto,
  ) {
    return firstValueFrom(
      this.userClient
        .send(MESSAGE_PATTERNS.ROLE.SET_PERMISSIONS, {
          roleId,
          permissionIds: dto.permissionIds,
        })
        .pipe(timeout(5000)),
    );
  }

  @Get('users/:userId/roles')
  @RequireModule(HRMSModuleKey.USER_MANAGEMENT, ModuleAction.VIEW)
  @RequirePermissions('user_management.view', 'user_management.manage')
  @ApiOperation({ summary: 'Get roles assigned to a user' })
  async getUserRoles(@Param('userId') userId: string) {
    const user = await firstValueFrom(
      this.userClient
        .send(MESSAGE_PATTERNS.USER.GET_USER, { id: userId })
        .pipe(timeout(5000)),
    );
    return user?.roles || [];
  }

  @Put('users/:userId/roles')
  @RequireModule(HRMSModuleKey.USER_MANAGEMENT, ModuleAction.MANAGE)
  @RequirePermissions('user_management.manage')
  @ApiOperation({ summary: 'Assign / replace roles for a user' })
  async setUserRoles(
    @Param('userId') userId: string,
    @Body() dto: AssignUserRolesDto,
  ) {
    return firstValueFrom(
      this.userClient
        .send(MESSAGE_PATTERNS.USER.SET_ROLES, {
          userId,
          roleIds: dto.roleIds,
        })
        .pipe(timeout(5000)),
    );
  }
}
