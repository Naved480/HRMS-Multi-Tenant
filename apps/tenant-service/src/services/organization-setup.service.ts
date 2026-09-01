import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  Tenant,
  TenantStatus,
  TenantSetupStatus,
  TenantProvisioningStatus,
  Department,
  Designation,
  WorkingHours,
  LeavePolicy,
  AttendancePolicy,
} from '../models';
import {
  UpdateOrganizationProfileDto,
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateDesignationDto,
  UpdateDesignationDto,
  UpdateWorkingHoursDto,
  CreateLeavePolicyDto,
  UpdateLeavePolicyDto,
  UpdateAttendancePolicyDto,
  TenantException,
  TenantErrorCode,
} from '@app/common';
import { TenantService } from './tenant.service';

export interface SetupProgressResult {
  tenantId: string;
  organizationName: string;
  status: TenantStatus;
  setupStatus: TenantSetupStatus;
  percentage: number;
  modules: {
    profile: boolean;
    departments: boolean;
    designations: boolean;
    workingHours: boolean;
    leavePolicy: boolean;
    attendancePolicy: boolean;
  };
  missingModules: string[];
  isComplete: boolean;
}

@Injectable()
export class OrganizationSetupService {
  private readonly logger = new Logger(OrganizationSetupService.name);

  constructor(
    private tenantService: TenantService,
    @InjectModel(Department) private departmentModel: typeof Department,
    @InjectModel(Designation) private designationModel: typeof Designation,
    @InjectModel(WorkingHours) private workingHoursModel: typeof WorkingHours,
    @InjectModel(LeavePolicy) private leavePolicyModel: typeof LeavePolicy,
    @InjectModel(AttendancePolicy) private attendancePolicyModel: typeof AttendancePolicy,
  ) {}

  /**
   * Get overall Organization Setup Progress
   */
  async getSetupProgress(tenantId: string): Promise<SetupProgressResult> {
    const tenant = await this.tenantService.getTenantById(tenantId);

    const departmentsCount = await this.departmentModel.count({ where: { tenantId } });
    const designationsCount = await this.designationModel.count({ where: { tenantId } });
    const workingHours = await this.workingHoursModel.findOne({ where: { tenantId } });
    const leavePoliciesCount = await this.leavePolicyModel.count({ where: { tenantId } });
    const attendancePolicy = await this.attendancePolicyModel.findOne({ where: { tenantId } });

    const profileCompleted = Boolean(
      tenant.organizationName && (tenant.country || tenant.address || tenant.timezone),
    );
    const departmentsCompleted = departmentsCount > 0;
    const designationsCompleted = designationsCount > 0;
    const workingHoursCompleted = Boolean(workingHours);
    const leavePolicyCompleted = leavePoliciesCount > 0;
    const attendancePolicyCompleted = Boolean(attendancePolicy);

    const modules = {
      profile: profileCompleted,
      departments: departmentsCompleted,
      designations: designationsCompleted,
      workingHours: workingHoursCompleted,
      leavePolicy: leavePolicyCompleted,
      attendancePolicy: attendancePolicyCompleted,
    };

    const missingModules: string[] = [];
    if (!profileCompleted) missingModules.push('Profile');
    if (!departmentsCompleted) missingModules.push('Departments');
    if (!designationsCompleted) missingModules.push('Designations');
    if (!workingHoursCompleted) missingModules.push('Working Hours');
    if (!leavePolicyCompleted) missingModules.push('Leave Policy');
    if (!attendancePolicyCompleted) missingModules.push('Attendance Policy');

    const completedCount = Object.values(modules).filter(Boolean).length;
    const percentage = Math.round((completedCount / 6) * 100);
    const isComplete = missingModules.length === 0;

    return {
      tenantId: tenant.id,
      organizationName: tenant.organizationName || tenant.name,
      status: tenant.status,
      setupStatus: tenant.setupStatus,
      percentage,
      modules,
      missingModules,
      isComplete,
    };
  }

  /**
   * Update Organization Profile
   */
  async updateOrganizationProfile(tenantId: string, dto: UpdateOrganizationProfileDto) {
    const tenant = await this.tenantService.getTenantById(tenantId);
    await tenant.update(dto);
    return tenant;
  }

  // ==========================================
  // DEPARTMENTS CRUD
  // ==========================================

  async getDepartments(tenantId: string) {
    return this.departmentModel.findAll({ where: { tenantId } });
  }

  async createDepartment(tenantId: string, dto: CreateDepartmentDto) {
    await this.tenantService.getTenantById(tenantId);
    const existing = await this.departmentModel.findOne({
      where: { tenantId, name: dto.name },
    });
    if (existing) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        `Department '${dto.name}' already exists in this organization.`,
      );
    }
    return this.departmentModel.create({ ...dto, tenantId });
  }

  async updateDepartment(tenantId: string, departmentId: string, dto: UpdateDepartmentDto) {
    const dept = await this.departmentModel.findOne({
      where: { id: departmentId, tenantId },
    });
    if (!dept) {
      throw new TenantException(TenantErrorCode.INVALID_TENANT_CONTEXT, 'Department not found.');
    }
    return dept.update(dto);
  }

  async deleteDepartment(tenantId: string, departmentId: string) {
    const dept = await this.departmentModel.findOne({
      where: { id: departmentId, tenantId },
    });
    if (!dept) {
      throw new TenantException(TenantErrorCode.INVALID_TENANT_CONTEXT, 'Department not found.');
    }
    await dept.destroy();
    return { message: `Department '${dept.name}' deleted successfully.` };
  }

  // ==========================================
  // DESIGNATIONS CRUD
  // ==========================================

  async getDesignations(tenantId: string) {
    return this.designationModel.findAll({
      where: { tenantId },
      include: [Department],
    });
  }

  async createDesignation(tenantId: string, dto: CreateDesignationDto) {
    await this.tenantService.getTenantById(tenantId);
    const existing = await this.designationModel.findOne({
      where: { tenantId, title: dto.title },
    });
    if (existing) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        `Designation '${dto.title}' already exists in this organization.`,
      );
    }
    return this.designationModel.create({ ...dto, tenantId });
  }

  async updateDesignation(tenantId: string, designationId: string, dto: UpdateDesignationDto) {
    const desig = await this.designationModel.findOne({
      where: { id: designationId, tenantId },
    });
    if (!desig) {
      throw new TenantException(TenantErrorCode.INVALID_TENANT_CONTEXT, 'Designation not found.');
    }
    return desig.update(dto);
  }

  async deleteDesignation(tenantId: string, designationId: string) {
    const desig = await this.designationModel.findOne({
      where: { id: designationId, tenantId },
    });
    if (!desig) {
      throw new TenantException(TenantErrorCode.INVALID_TENANT_CONTEXT, 'Designation not found.');
    }
    await desig.destroy();
    return { message: `Designation '${desig.title}' deleted successfully.` };
  }

  // ==========================================
  // WORKING HOURS & SHIFTS
  // ==========================================

  async getWorkingHours(tenantId: string) {
    return this.workingHoursModel.findOne({ where: { tenantId } });
  }

  async updateWorkingHours(tenantId: string, dto: UpdateWorkingHoursDto) {
    await this.tenantService.getTenantById(tenantId);
    const existing = await this.workingHoursModel.findOne({ where: { tenantId } });
    if (existing) {
      return existing.update({
        ...dto,
        workingDays: dto.workingDays || existing.workingDays,
      });
    }
    return this.workingHoursModel.create({
      ...dto,
      tenantId,
      name: dto.name || 'Standard Office Shift',
      workingDays: dto.workingDays || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    });
  }

  // ==========================================
  // LEAVE POLICIES CRUD
  // ==========================================

  async getLeavePolicies(tenantId: string) {
    return this.leavePolicyModel.findAll({ where: { tenantId } });
  }

  async createLeavePolicy(tenantId: string, dto: CreateLeavePolicyDto) {
    await this.tenantService.getTenantById(tenantId);
    const existing = await this.leavePolicyModel.findOne({
      where: { tenantId, name: dto.name },
    });
    if (existing) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        `Leave Policy '${dto.name}' already exists in this organization.`,
      );
    }
    return this.leavePolicyModel.create({ ...dto, tenantId });
  }

  async updateLeavePolicy(tenantId: string, policyId: string, dto: UpdateLeavePolicyDto) {
    const policy = await this.leavePolicyModel.findOne({
      where: { id: policyId, tenantId },
    });
    if (!policy) {
      throw new TenantException(TenantErrorCode.INVALID_TENANT_CONTEXT, 'Leave Policy not found.');
    }
    return policy.update(dto);
  }

  async deleteLeavePolicy(tenantId: string, policyId: string) {
    const policy = await this.leavePolicyModel.findOne({
      where: { id: policyId, tenantId },
    });
    if (!policy) {
      throw new TenantException(TenantErrorCode.INVALID_TENANT_CONTEXT, 'Leave Policy not found.');
    }
    await policy.destroy();
    return { message: `Leave Policy '${policy.name}' deleted successfully.` };
  }

  // ==========================================
  // ATTENDANCE POLICY
  // ==========================================

  async getAttendancePolicy(tenantId: string) {
    return this.attendancePolicyModel.findOne({ where: { tenantId } });
  }

  async updateAttendancePolicy(tenantId: string, dto: UpdateAttendancePolicyDto) {
    await this.tenantService.getTenantById(tenantId);
    const existing = await this.attendancePolicyModel.findOne({ where: { tenantId } });
    if (existing) {
      return existing.update(dto);
    }
    return this.attendancePolicyModel.create({ ...dto, tenantId });
  }

  // ==========================================
  // SETUP COMPLETION (LIFECYCLE TRANSITION)
  // ==========================================

  /**
   * Finalize Setup Wizard & Activate Organization Tenant
   */
  async completeSetup(tenantId: string) {
    const tenant = await this.tenantService.getTenantById(tenantId);

    // Idempotent Check: If already COMPLETED and ACTIVE
    if (
      tenant.setupStatus === TenantSetupStatus.COMPLETED &&
      tenant.status === TenantStatus.ACTIVE
    ) {
      return {
        message: 'Organization setup is already completed and organization is ACTIVE.',
        tenantId: tenant.id,
        status: TenantStatus.ACTIVE,
        setupStatus: TenantSetupStatus.COMPLETED,
        provisioningStatus: TenantProvisioningStatus.READY,
      };
    }

    const progress = await this.getSetupProgress(tenantId);

    if (!progress.isComplete) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        `Cannot complete organization setup. Pending modules: ${progress.missingModules.join(', ')}. Please configure all required sections first.`,
      );
    }

    // Transition tenant to ACTIVE status
    await tenant.update({
      status: TenantStatus.ACTIVE,
      setupStatus: TenantSetupStatus.COMPLETED,
      provisioningStatus: TenantProvisioningStatus.READY,
    });

    this.logger.log(`Organization ${tenant.id} (${tenant.name}) setup COMPLETED. Tenant status set to ACTIVE.`);

    return {
      message: 'Organization setup completed successfully. Organization is now ACTIVE.',
      tenantId: tenant.id,
      organizationName: tenant.organizationName || tenant.name,
      status: TenantStatus.ACTIVE,
      setupStatus: TenantSetupStatus.COMPLETED,
      provisioningStatus: TenantProvisioningStatus.READY,
    };
  }
}
