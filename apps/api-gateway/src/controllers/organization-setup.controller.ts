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
} from '@app/common';

@ApiTags('Organization Setup Wizard')
@Controller('organization')
@ApiBearerAuth()
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
  @ApiOperation({ summary: 'Configure Organization Profile & General Settings' })
  updateOrganizationProfile(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: UpdateOrganizationProfileDto,
  ) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.UPDATE_PROFILE, { tenantId, dto });
  }

  // ==========================================
  // DEPARTMENTS
  // ==========================================

  @Get('departments')
  @ApiOperation({ summary: 'List all departments for organization' })
  getDepartments(@Headers('x-tenant-id') tenantId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.GET_DEPARTMENTS, { tenantId });
  }

  @Post('departments')
  @ApiOperation({ summary: 'Create new department' })
  createDepartment(@Headers('x-tenant-id') tenantId: string, @Body() dto: CreateDepartmentDto) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.CREATE_DEPARTMENT, { tenantId, dto });
  }

  @Patch('departments/:id')
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

  @Delete('departments/:id')
  @ApiOperation({ summary: 'Delete department' })
  deleteDepartment(@Headers('x-tenant-id') tenantId: string, @Param('id') departmentId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.DELETE_DEPARTMENT, {
      tenantId,
      departmentId,
    });
  }

  // ==========================================
  // DESIGNATIONS
  // ==========================================

  @Get('designations')
  @ApiOperation({ summary: 'List all designations for organization' })
  getDesignations(@Headers('x-tenant-id') tenantId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.GET_DESIGNATIONS, { tenantId });
  }

  @Post('designations')
  @ApiOperation({ summary: 'Create new designation' })
  createDesignation(@Headers('x-tenant-id') tenantId: string, @Body() dto: CreateDesignationDto) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.CREATE_DESIGNATION, { tenantId, dto });
  }

  @Patch('designations/:id')
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

  @Delete('designations/:id')
  @ApiOperation({ summary: 'Delete designation' })
  deleteDesignation(@Headers('x-tenant-id') tenantId: string, @Param('id') designationId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.DELETE_DESIGNATION, {
      tenantId,
      designationId,
    });
  }

  // ==========================================
  // WORKING HOURS / SHIFTS
  // ==========================================

  @Get('working-hours')
  @ApiOperation({ summary: 'Get organization working hours & shift configuration' })
  getWorkingHours(@Headers('x-tenant-id') tenantId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.GET_WORKING_HOURS, { tenantId });
  }

  @Put('working-hours')
  @ApiOperation({ summary: 'Configure organization working hours & shift configuration' })
  updateWorkingHours(@Headers('x-tenant-id') tenantId: string, @Body() dto: UpdateWorkingHoursDto) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.UPDATE_WORKING_HOURS, {
      tenantId,
      dto,
    });
  }

  // ==========================================
  // LEAVE POLICIES
  // ==========================================

  @Get('leave-policy')
  @ApiOperation({ summary: 'List organization leave policies' })
  getLeavePolicies(@Headers('x-tenant-id') tenantId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.GET_LEAVE_POLICIES, { tenantId });
  }

  @Post('leave-policy')
  @ApiOperation({ summary: 'Create leave policy' })
  createLeavePolicy(@Headers('x-tenant-id') tenantId: string, @Body() dto: CreateLeavePolicyDto) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.CREATE_LEAVE_POLICY, { tenantId, dto });
  }

  @Patch('leave-policy/:id')
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

  @Delete('leave-policy/:id')
  @ApiOperation({ summary: 'Delete leave policy' })
  deleteLeavePolicy(@Headers('x-tenant-id') tenantId: string, @Param('id') policyId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.DELETE_LEAVE_POLICY, {
      tenantId,
      policyId,
    });
  }

  // ==========================================
  // ATTENDANCE POLICY
  // ==========================================

  @Get('attendance-policy')
  @ApiOperation({ summary: 'Get organization attendance policy' })
  getAttendancePolicy(@Headers('x-tenant-id') tenantId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.GET_ATTENDANCE_POLICY, { tenantId });
  }

  @Put('attendance-policy')
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
  @ApiOperation({ summary: 'Finalize Setup Wizard & Activate Organization Tenant (status -> ACTIVE)' })
  completeSetup(@Headers('x-tenant-id') tenantId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION_SETUP.COMPLETE_SETUP, { tenantId });
  }
}
