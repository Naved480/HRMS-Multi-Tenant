import { Controller, Post, Get, Body, Param, Delete } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  MESSAGE_PATTERNS,
  CreateOrganizationDto,
  CreateAdminInvitationDto,
  ActivateAdminDto,
  UpdateOrganizationProfileDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateDesignationDto,
  UpdateDesignationDto,
  UpdateWorkingHoursDto,
  CreateLeavePolicyDto,
  UpdateLeavePolicyDto,
  UpdateAttendancePolicyDto,
  // Policy Engine DTOs
  CreateOrganizationPolicyDto,
  UpdateOrganizationPolicyDto,
  ActivatePolicyDto,
  CreateNewPolicyVersionDto,
  GetPoliciesQueryDto,
  PolicyType,
} from '@app/common';
import { TenantService } from './services/tenant.service';
import { TenantProvisioningService } from './services/tenant-provisioning.service';
import { OrganizationAdminInvitationService } from './services/organization-admin-invitation.service';
import { OrganizationSetupService } from './services/organization-setup.service';
import { OrganizationPolicyService } from './services/organization-policy.service';

import { OrganizationModuleAccessService } from './services/organization-module-access.service';
import { OrganizationOnboardingValidatorService } from './services/organization-onboarding-validator.service';

@Controller('tenants')
export class TenantServiceController {
  constructor(
    private tenantService: TenantService,
    private tenantProvisioningService: TenantProvisioningService,
    private invitationService: OrganizationAdminInvitationService,
    private setupService: OrganizationSetupService,
    private policyService: OrganizationPolicyService,
    private moduleAccessService: OrganizationModuleAccessService,
    private onboardingValidatorService: OrganizationOnboardingValidatorService,
  ) {}

  @MessagePattern(MESSAGE_PATTERNS.HEALTH.CHECK)
  healthCheck() {
    return { service: 'tenant-service', status: 'up', timestamp: new Date().toISOString() };
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION.CREATE_ORGANIZATION)
  async createOrganizationMessage(@Payload() dto: any) {
    return this.tenantProvisioningService.createOrganizationAndProvision(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION.VALIDATE_ONBOARDING)
  async validateOnboardingMessage(@Payload() dto: any) {
    return this.onboardingValidatorService.validateOnboardingPayload(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION.REVIEW_ONBOARDING)
  async reviewOnboardingMessage(@Payload() dto: any) {
    return this.onboardingValidatorService.generateReviewSummary(dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION.GET_MODULE_ACCESS)
  async getModuleAccessMessage(@Payload() data: { tenantId: string }) {
    return this.moduleAccessService.getOrganizationModules(data.tenantId);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION.UPDATE_MODULE_ACCESS)
  async updateModuleAccessMessage(@Payload() data: { tenantId: string; modules: any[] }) {
    return this.moduleAccessService.setOrganizationModules(data.tenantId, data.modules);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION.CHECK_MODULE_ACCESS)
  async checkModuleAccessMessage(@Payload() data: { tenantId: string; moduleKey: string; action?: string }) {
    return this.moduleAccessService.isModuleEnabled(data.tenantId, data.moduleKey, data.action);
  }

  @MessagePattern(MESSAGE_PATTERNS.TENANT.PROVISION_TENANT)
  async provisionTenantMessage(@Payload() data: { tenantId: string }) {
    return this.tenantProvisioningService.provisionTenantDatabase(data.tenantId);
  }

  @MessagePattern(MESSAGE_PATTERNS.TENANT.RETRY_PROVISION)
  async retryProvisioningMessage(@Payload() data: { tenantId: string }) {
    return this.tenantProvisioningService.retryProvisioning(data.tenantId);
  }

  // ==========================================
  // INVITATION MESSAGE PATTERNS
  // ==========================================

  @MessagePattern(MESSAGE_PATTERNS.INVITATION.CREATE)
  async createAdminInvitationMessage(
    @Payload() data: { tenantId: string; dto: CreateAdminInvitationDto; createdBy?: string },
  ) {
    return this.invitationService.createAdminInvitation(
      data.tenantId,
      data.dto?.adminEmail,
      data.dto?.adminName,
      data.createdBy,
    );
  }

  @MessagePattern(MESSAGE_PATTERNS.INVITATION.RESEND)
  async resendAdminInvitationMessage(@Payload() data: { tenantId: string }) {
    return this.invitationService.resendAdminInvitation(data.tenantId);
  }

  @MessagePattern(MESSAGE_PATTERNS.INVITATION.VALIDATE)
  async validateInvitationTokenMessage(@Payload() data: { token: string }) {
    return this.invitationService.validateInvitationToken(data.token);
  }

  @MessagePattern(MESSAGE_PATTERNS.INVITATION.ACTIVATE)
  async activateAdminAccountMessage(@Payload() dto: ActivateAdminDto) {
    return this.invitationService.activateAdminAccount(dto);
  }

  // ==========================================
  // ORGANIZATION SETUP WIZARD MESSAGE PATTERNS
  // ==========================================

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.GET_PROGRESS)
  async getSetupProgressMessage(@Payload() data: { tenantId: string }) {
    return this.setupService.getSetupProgress(data.tenantId);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.UPDATE_PROFILE)
  async updateProfileMessage(@Payload() data: { tenantId: string; dto: UpdateOrganizationProfileDto }) {
    return this.setupService.updateOrganizationProfile(data.tenantId, data.dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.GET_DEPARTMENTS)
  async getDepartmentsMessage(@Payload() data: { tenantId: string }) {
    return this.setupService.getDepartments(data.tenantId);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.CREATE_DEPARTMENT)
  async createDepartmentMessage(@Payload() data: { tenantId: string; dto: CreateDepartmentDto }) {
    return this.setupService.createDepartment(data.tenantId, data.dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.UPDATE_DEPARTMENT)
  async updateDepartmentMessage(
    @Payload() data: { tenantId: string; departmentId: string; dto: UpdateDepartmentDto },
  ) {
    return this.setupService.updateDepartment(data.tenantId, data.departmentId, data.dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.DELETE_DEPARTMENT)
  async deleteDepartmentMessage(@Payload() data: { tenantId: string; departmentId: string }) {
    return this.setupService.deleteDepartment(data.tenantId, data.departmentId);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.GET_DESIGNATIONS)
  async getDesignationsMessage(@Payload() data: { tenantId: string }) {
    return this.setupService.getDesignations(data.tenantId);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.CREATE_DESIGNATION)
  async createDesignationMessage(@Payload() data: { tenantId: string; dto: CreateDesignationDto }) {
    return this.setupService.createDesignation(data.tenantId, data.dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.UPDATE_DESIGNATION)
  async updateDesignationMessage(
    @Payload() data: { tenantId: string; designationId: string; dto: UpdateDesignationDto },
  ) {
    return this.setupService.updateDesignation(data.tenantId, data.designationId, data.dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.DELETE_DESIGNATION)
  async deleteDesignationMessage(@Payload() data: { tenantId: string; designationId: string }) {
    return this.setupService.deleteDesignation(data.tenantId, data.designationId);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.GET_WORKING_HOURS)
  async getWorkingHoursMessage(@Payload() data: { tenantId: string }) {
    return this.setupService.getWorkingHours(data.tenantId);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.UPDATE_WORKING_HOURS)
  async updateWorkingHoursMessage(@Payload() data: { tenantId: string; dto: UpdateWorkingHoursDto }) {
    return this.setupService.updateWorkingHours(data.tenantId, data.dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.GET_LEAVE_POLICIES)
  async getLeavePoliciesMessage(@Payload() data: { tenantId: string }) {
    return this.setupService.getLeavePolicies(data.tenantId);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.CREATE_LEAVE_POLICY)
  async createLeavePolicyMessage(@Payload() data: { tenantId: string; dto: CreateLeavePolicyDto }) {
    return this.setupService.createLeavePolicy(data.tenantId, data.dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.UPDATE_LEAVE_POLICY)
  async updateLeavePolicyMessage(
    @Payload() data: { tenantId: string; policyId: string; dto: UpdateLeavePolicyDto },
  ) {
    return this.setupService.updateLeavePolicy(data.tenantId, data.policyId, data.dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.DELETE_LEAVE_POLICY)
  async deleteLeavePolicyMessage(@Payload() data: { tenantId: string; policyId: string }) {
    return this.setupService.deleteLeavePolicy(data.tenantId, data.policyId);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.GET_ATTENDANCE_POLICY)
  async getAttendancePolicyMessage(@Payload() data: { tenantId: string }) {
    return this.setupService.getAttendancePolicy(data.tenantId);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.UPDATE_ATTENDANCE_POLICY)
  async updateAttendancePolicyMessage(
    @Payload() data: { tenantId: string; dto: UpdateAttendancePolicyDto },
  ) {
    return this.setupService.updateAttendancePolicy(data.tenantId, data.dto);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_SETUP.COMPLETE_SETUP)
  async completeSetupMessage(@Payload() data: { tenantId: string }) {
    return this.setupService.completeSetup(data.tenantId);
  }

  // ==========================================
  // DYNAMIC POLICY ENGINE MESSAGE PATTERNS
  // ==========================================

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_POLICY.CREATE)
  async createPolicyMessage(
    @Payload() data: { tenantId: string; dto: CreateOrganizationPolicyDto; createdBy?: string },
  ) {
    return this.policyService.createPolicy(data.tenantId, data.dto, data.createdBy);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_POLICY.GET_ALL)
  async getPoliciesMessage(@Payload() data: { tenantId: string; query?: GetPoliciesQueryDto }) {
    return this.policyService.getPolicies(data.tenantId, data.query);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_POLICY.GET_ONE)
  async getPolicyByIdMessage(@Payload() data: { tenantId: string; policyId: string }) {
    return this.policyService.getPolicyById(data.tenantId, data.policyId);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_POLICY.UPDATE)
  async updatePolicyMessage(
    @Payload() data: { tenantId: string; policyId: string; dto: UpdateOrganizationPolicyDto; updatedBy?: string },
  ) {
    return this.policyService.updatePolicy(data.tenantId, data.policyId, data.dto, data.updatedBy);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_POLICY.DELETE)
  async deletePolicyMessage(@Payload() data: { tenantId: string; policyId: string }) {
    return this.policyService.deletePolicy(data.tenantId, data.policyId);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_POLICY.ACTIVATE)
  async activatePolicyMessage(
    @Payload() data: { tenantId: string; policyId: string; dto?: ActivatePolicyDto; activatedBy?: string },
  ) {
    return this.policyService.activatePolicy(data.tenantId, data.policyId, data.dto, data.activatedBy);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_POLICY.DEACTIVATE)
  async deactivatePolicyMessage(
    @Payload() data: { tenantId: string; policyId: string; updatedBy?: string },
  ) {
    return this.policyService.deactivatePolicy(data.tenantId, data.policyId, data.updatedBy);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_POLICY.ARCHIVE)
  async archivePolicyMessage(
    @Payload() data: { tenantId: string; policyId: string; updatedBy?: string },
  ) {
    return this.policyService.archivePolicy(data.tenantId, data.policyId, data.updatedBy);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_POLICY.GET_ACTIVE)
  async getActivePolicyMessage(@Payload() data: { tenantId: string; policyType: PolicyType }) {
    return this.policyService.getActivePolicy(data.tenantId, data.policyType);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_POLICY.GET_VERSIONS)
  async getPolicyVersionsMessage(@Payload() data: { tenantId: string; policyId: string }) {
    return this.policyService.getPolicyVersions(data.tenantId, data.policyId);
  }

  @MessagePattern(MESSAGE_PATTERNS.ORGANIZATION_POLICY.CREATE_VERSION)
  async createNewVersionMessage(
    @Payload() data: { tenantId: string; policyId: string; dto: CreateNewPolicyVersionDto; createdBy?: string },
  ) {
    return this.policyService.createNewVersion(data.tenantId, data.policyId, data.dto, data.createdBy);
  }

  // ==========================================
  // DIRECT HTTP ENDPOINTS (legacy dev routes)
  // ==========================================

  @Post('provision')
  async provisionTenant(
    @Body()
    data: {
      tenantName: string;
      organizationName: string;
      email: string;
      planType: string;
    },
  ) {
    return this.tenantProvisioningService.createOrganizationAndProvision({
      organizationName: data.organizationName || data.tenantName,
      adminEmail: data.email,
    });
  }

  @Get()
  async getAllTenants() {
    return this.tenantService.getAllTenants();
  }

  @Get(':id')
  async getTenantById(@Param('id') tenantId: string) {
    return this.tenantService.getTenantById(tenantId);
  }

  @Delete(':id')
  async deprovisionTenant(@Param('id') tenantId: string) {
    await this.tenantProvisioningService.deprovisionTenant(tenantId);
    return { message: `Tenant ${tenantId} deprovisioned successfully` };
  }
}
