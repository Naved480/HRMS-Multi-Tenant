import { Injectable } from '@nestjs/common';
import {
  CreateOrganizationOnboardingDto,
  HRMSModuleKey,
  TenantException,
  TenantErrorCode,
} from '@app/common';
import { TenantService } from './tenant.service';

export interface OnboardingReviewSummary {
  isValid: boolean;
  organization: {
    organizationName: string;
    domain?: string;
    slug: string;
  };
  initialAdmin: {
    firstName: string;
    lastName: string;
    workEmail: string;
    phone?: string;
    industry?: string;
    averageUsers?: string;
    jobTitle?: string;
    initialDepartment?: string;
    sendInvitation: boolean;
    customInvitationMessage?: string;
  };
  modules: {
    totalConfigured: number;
    enabledModules: string[];
    disabledModules: string[];
    moduleDetails: Array<{
      moduleKey: string;
      enabled: boolean;
      allowedActions: string[];
    }>;
  };
  scope: {
    departments: string[];
    locations: string[];
    teams: string[];
    designations: string[];
  };
  warnings: string[];
}

@Injectable()
export class OrganizationOnboardingValidatorService {
  constructor(private tenantService: TenantService) {}

  /**
   * Validate full onboarding payload
   */
  async validateOnboardingPayload(dto: CreateOrganizationOnboardingDto): Promise<{ isValid: boolean; messages: string[] }> {
    const messages: string[] = [];

    // Step 1 Validation
    if (!dto.organizationName || dto.organizationName.trim().length === 0) {
      messages.push('Organization Name is required.');
    }

    if (!dto.adminDetails) {
      messages.push('Initial Admin Details are required (Step 1).');
    } else {
      if (!dto.adminDetails.workEmail) {
        messages.push('Admin Work Email is required.');
      }
      if (!dto.adminDetails.firstName) {
        messages.push('Admin First Name is required.');
      }
      if (!dto.adminDetails.lastName) {
        messages.push('Admin Last Name is required.');
      }
    }

    // Check duplicate organization domain/slug
    if (dto.organizationName) {
      const slug = (dto.domain || dto.organizationName)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-');

      const existing = await this.tenantService.getTenantByDomainOrSlug(slug);
      if (existing) {
        throw new TenantException(
          TenantErrorCode.INVALID_TENANT_CONTEXT,
          `An organization with domain/slug '${slug}' already exists.`,
        );
      }
    }

    // Step 2 Validation (Modules)
    if (dto.modules && dto.modules.length > 0) {
      const validModules = Object.values(HRMSModuleKey) as string[];
      for (const mod of dto.modules) {
        if (!validModules.includes(mod.moduleKey.toLowerCase())) {
          messages.push(`Invalid module key '${mod.moduleKey}' provided.`);
        }
      }
    }

    return {
      isValid: messages.length === 0,
      messages,
    };
  }

  /**
   * Generate Step 4 Review & Confirm summary
   */
  async generateReviewSummary(dto: CreateOrganizationOnboardingDto): Promise<OnboardingReviewSummary> {
    const validation = await this.validateOnboardingPayload(dto);
    if (!validation.isValid) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        `Validation failed for organization onboarding: ${validation.messages.join('; ')}`,
      );
    }

    const slug = (dto.domain || dto.organizationName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');

    const modules = dto.modules || [];
    const enabledModules = modules.filter((m) => m.enabled).map((m) => m.moduleKey);
    const disabledModules = modules.filter((m) => !m.enabled).map((m) => m.moduleKey);

    const warnings: string[] = [];
    if (enabledModules.length === 0) {
      warnings.push('No modules were explicitly enabled. Default HRMS modules will be enabled.');
    }

    return {
      isValid: true,
      organization: {
        organizationName: dto.organizationName,
        domain: dto.domain,
        slug,
      },
      initialAdmin: {
        firstName: dto.adminDetails.firstName,
        lastName: dto.adminDetails.lastName,
        workEmail: dto.adminDetails.workEmail,
        phone: dto.adminDetails.phone,
        industry: dto.adminDetails.industry,
        averageUsers: dto.adminDetails.averageUsers,
        jobTitle: dto.adminDetails.jobTitle,
        initialDepartment: dto.adminDetails.initialDepartment,
        sendInvitation: dto.adminDetails.sendInvitation !== false,
        customInvitationMessage: dto.adminDetails.customInvitationMessage,
      },
      modules: {
        totalConfigured: modules.length,
        enabledModules,
        disabledModules,
        moduleDetails: modules.map((m) => ({
          moduleKey: m.moduleKey,
          enabled: m.enabled,
          allowedActions: m.allowedActions || ['all'],
        })),
      },
      scope: {
        departments: dto.scope?.departments || [],
        locations: dto.scope?.locations || [],
        teams: dto.scope?.teams || [],
        designations: dto.scope?.designations || [],
      },
      warnings,
    };
  }
}
