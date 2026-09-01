import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Headers,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import {
  SERVICES,
  MESSAGE_PATTERNS,
  UpdateOrganizationProfileDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateDesignationDto,
  UpdateDesignationDto,
  UpdateWorkingHoursDto,
  CreateLeavePolicyDto,
  UpdateLeavePolicyDto,
  UpdateAttendancePolicyDto,
  HRMSModuleKey,
  ModuleAction,
} from '@app/common';
import {
  TenantGuard,
  RolesGuard,
  PermissionsGuard,
  OrganizationModuleGuard,
  RequireModule,
} from '@app/tenant-context';

@ApiTags('Organization Setup Wizard')
@Controller('organization')
@ApiBearerAuth()
@UseGuards(TenantGuard, RolesGuard, PermissionsGuard, OrganizationModuleGuard)
@ApiHeader({ name: 'x-tenant-id', description: 'Target Organization Tenant ID', required: true })
export class OrganizationSetupController {
  constructor(
    @Inject(SERVICES.TENANT_SERVICE) private readonly tenantClient: ClientProxy,
  ) {}

  @Get('setup/progress')
  @ApiOperation({ summary: 'Get Organization Setup Wizard progress & module completion checklist' })
  getSetupProgress(@Headers('x-tenant-id') tenantId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.GET_PROGRESS, { tenantId });
  }

  @Put('setup/profile')
  @RequireModule(HRMSModuleKey.SETTINGS, ModuleAction.EDIT)
  @ApiOperation({ summary: 'Configure Organization Profile & General Settings' })
  updateOrganizationProfile(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: UpdateOrganizationProfileDto,
  ) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.UPDATE_PROFILE, { tenantId, dto });
  }

  // ==========================================
  // DEPARTMENTS (Supports both /departments & /setup/departments)
  // ==========================================

  @Get(['departments', 'setup/departments'])
  @RequireModule(HRMSModuleKey.DEPARTMENTS)
  @ApiOperation({ summary: 'List all departments for organization' })
  getDepartments(@Headers('x-tenant-id') tenantId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.GET_DEPARTMENTS, { tenantId });
  }

  @Post(['departments', 'setup/departments'])
  @RequireModule(HRMSModuleKey.DEPARTMENTS, ModuleAction.CREATE)
  @ApiOperation({ summary: 'Create new department' })
  createDepartment(@Headers('x-tenant-id') tenantId: string, @Body() dto: CreateDepartmentDto) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.CREATE_DEPARTMENT, { tenantId, dto });
  }

  @Patch(['departments/:id', 'setup/departments/:id'])
  @RequireModule(HRMSModuleKey.DEPARTMENTS, ModuleAction.EDIT)
  @ApiOperation({ summary: 'Update department' })
  updateDepartment(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') departmentId: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.UPDATE_DEPARTMENT, {
      tenantId,
      departmentId,
      dto,
    });
  }

  @Delete(['departments/:id', 'setup/departments/:id'])
  @RequireModule(HRMSModuleKey.DEPARTMENTS, ModuleAction.DELETE)
  @ApiOperation({ summary: 'Delete department' })
  deleteDepartment(@Headers('x-tenant-id') tenantId: string, @Param('id') departmentId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.DELETE_DEPARTMENT, {
      tenantId,
      departmentId,
    });
  }

  // ==========================================
  // DESIGNATIONS (Supports both /designations & /setup/designations)
  // ==========================================

  @Get(['designations', 'setup/designations'])
  @RequireModule(HRMSModuleKey.EMPLOYEE)
  @ApiOperation({ summary: 'List all designations for organization' })
  getDesignations(@Headers('x-tenant-id') tenantId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.GET_DESIGNATIONS, { tenantId });
  }

  @Post(['designations', 'setup/designations'])
  @RequireModule(HRMSModuleKey.EMPLOYEE, ModuleAction.CREATE)
  @ApiOperation({ summary: 'Create new designation' })
  createDesignation(@Headers('x-tenant-id') tenantId: string, @Body() dto: CreateDesignationDto) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.CREATE_DESIGNATION, { tenantId, dto });
  }

  @Patch(['designations/:id', 'setup/designations/:id'])
  @RequireModule(HRMSModuleKey.EMPLOYEE, ModuleAction.EDIT)
  @ApiOperation({ summary: 'Update designation' })
  updateDesignation(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') designationId: string,
    @Body() dto: UpdateDesignationDto,
  ) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.UPDATE_DESIGNATION, {
      tenantId,
      designationId,
      dto,
    });
  }

  @Delete(['designations/:id', 'setup/designations/:id'])
  @RequireModule(HRMSModuleKey.EMPLOYEE, ModuleAction.DELETE)
  @ApiOperation({ summary: 'Delete designation' })
  deleteDesignation(@Headers('x-tenant-id') tenantId: string, @Param('id') designationId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.DELETE_DESIGNATION, {
      tenantId,
      designationId,
    });
  }

  // ==========================================
  // WORKING HOURS / SHIFTS (Supports both /working-hours & /setup/working-hours)
  // ==========================================

  @Get(['working-hours', 'setup/working-hours'])
  @RequireModule(HRMSModuleKey.ATTENDANCE)
  @ApiOperation({ summary: 'Get organization working hours & shift configuration' })
  getWorkingHours(@Headers('x-tenant-id') tenantId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.GET_WORKING_HOURS, { tenantId });
  }

  @Put(['working-hours', 'setup/working-hours'])
  @RequireModule(HRMSModuleKey.ATTENDANCE, ModuleAction.EDIT)
  @ApiOperation({ summary: 'Configure organization working hours & shift configuration' })
  updateWorkingHours(@Headers('x-tenant-id') tenantId: string, @Body() dto: UpdateWorkingHoursDto) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.UPDATE_WORKING_HOURS, {
      tenantId,
      dto,
    });
  }

  // ==========================================
  // LEAVE POLICIES (Supports both /leave-policy & /setup/leave-policies)
  // ==========================================

  @Get(['leave-policy', 'setup/leave-policies'])
  @RequireModule(HRMSModuleKey.LEAVE_MANAGEMENT)
  @ApiOperation({ summary: 'List organization leave policies' })
  getLeavePolicies(@Headers('x-tenant-id') tenantId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.GET_LEAVE_POLICIES, { tenantId });
  }

  @Post(['leave-policy', 'setup/leave-policies'])
  @RequireModule(HRMSModuleKey.LEAVE_MANAGEMENT, ModuleAction.CREATE)
  @ApiOperation({ summary: 'Create leave policy' })
  createLeavePolicy(@Headers('x-tenant-id') tenantId: string, @Body() dto: CreateLeavePolicyDto) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.CREATE_LEAVE_POLICY, { tenantId, dto });
  }

  @Patch(['leave-policy/:id', 'setup/leave-policies/:id'])
  @RequireModule(HRMSModuleKey.LEAVE_MANAGEMENT, ModuleAction.EDIT)
  @ApiOperation({ summary: 'Update leave policy' })
  updateLeavePolicy(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') policyId: string,
    @Body() dto: UpdateLeavePolicyDto,
  ) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.UPDATE_LEAVE_POLICY, {
      tenantId,
      policyId,
      dto,
    });
  }

  @Delete(['leave-policy/:id', 'setup/leave-policies/:id'])
  @RequireModule(HRMSModuleKey.LEAVE_MANAGEMENT, ModuleAction.DELETE)
  @ApiOperation({ summary: 'Delete leave policy' })
  deleteLeavePolicy(@Headers('x-tenant-id') tenantId: string, @Param('id') policyId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.DELETE_LEAVE_POLICY, {
      tenantId,
      policyId,
    });
  }

  // ==========================================
  // ATTENDANCE POLICY (Supports both /attendance-policy & /setup/attendance-policy)
  // ==========================================

  @Get(['attendance-policy', 'setup/attendance-policy'])
  @RequireModule(HRMSModuleKey.ATTENDANCE)
  @ApiOperation({ summary: 'Get organization attendance policy' })
  getAttendancePolicy(@Headers('x-tenant-id') tenantId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.GET_ATTENDANCE_POLICY, { tenantId });
  }

  @Put(['attendance-policy', 'setup/attendance-policy'])
  @RequireModule(HRMSModuleKey.ATTENDANCE, ModuleAction.EDIT)
  @ApiOperation({ summary: 'Configure organization attendance policy' })
  updateAttendancePolicy(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: UpdateAttendancePolicyDto,
  ) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.UPDATE_ATTENDANCE_POLICY, {
      tenantId,
      dto,
    });
  }

  // ==========================================
  // SETUP COMPLETION (LIFECYCLE TRANSITION)
  // ==========================================

  @Post('setup/complete')
  @RequireModule(HRMSModuleKey.SETTINGS, ModuleAction.MANAGE)
  @ApiOperation({ summary: 'Finalize Setup Wizard & Activate Organization Tenant (status -> ACTIVE)' })
  completeSetup(@Headers('x-tenant-id') tenantId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.COMPLETE_SETUP, { tenantId });
  }
}
