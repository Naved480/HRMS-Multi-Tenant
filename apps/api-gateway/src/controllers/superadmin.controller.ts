import { Controller, Post, Get, Put, Body, Inject, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import {
  SERVICES,
  MESSAGE_PATTERNS,
  SuperAdminLoginDto,
  OnboardOrganizationDto,
  CreateOrganizationDto,
  CreateOrganizationOnboardingDto,
  ValidateOrganizationOnboardingDto,
  UpdateOrganizationModuleAccessDto,
  CreateAdminInvitationDto,
  PlatformRoute,
} from '@app/common';

@ApiTags('SuperAdmin Platform Management')
@Controller('superadmin')
@PlatformRoute()
export class SuperAdminController {
  constructor(
    @Inject(SERVICES.AUTH_SERVICE) private readonly authClient: ClientProxy,
    @Inject(SERVICES.TENANT_SERVICE) private readonly tenantClient: ClientProxy,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'SuperAdmin System Login' })
  superAdminLogin(@Body() dto: SuperAdminLoginDto) {
    return this.authClient.send(MESSAGE_PATTERNS.AUTH.SUPERADMIN_LOGIN, dto);
  }

  @Post('organizations/onboard')
  @ApiOperation({ summary: 'Onboard a new organization tenant with isolated database setup' })
  onboardOrganization(@Body() dto: OnboardOrganizationDto) {
    return this.authClient.send(MESSAGE_PATTERNS.AUTH.ONBOARD_ORGANIZATION, dto);
  }

  @Post('organizations/validate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SuperAdmin Step Validation: Validate Organization Onboarding Payload' })
  validateOrganizationOnboarding(@Body() dto: ValidateOrganizationOnboardingDto) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION.VALIDATE_ONBOARDING, dto);
  }

  @Post('organizations/review')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SuperAdmin Step 4: Review & Confirm Organization Setup Summary' })
  reviewOrganizationOnboarding(@Body() dto: CreateOrganizationOnboardingDto) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION.REVIEW_ONBOARDING, dto);
  }

  @Post('organizations')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SuperAdmin: Create Organization & Provision Isolated Database' })
  createOrganization(@Body() dto: CreateOrganizationDto) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION.CREATE_ORGANIZATION, dto);
  }

  @Post('organizations/create-full')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SuperAdmin Flow: Full Multi-Step Organization Onboarding Creation' })
  createFullOrganization(@Body() dto: CreateOrganizationOnboardingDto) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION.CREATE_ORGANIZATION, dto);
  }

  @Get('organizations/:tenantId/modules')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SuperAdmin: Get Organization Module Entitlements & Permissions' })
  getOrganizationModules(@Param('tenantId') tenantId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION.GET_MODULE_ACCESS, { tenantId });
  }

  @Put('organizations/:tenantId/modules')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SuperAdmin: Update Organization Module Entitlements & Permissions' })
  updateOrganizationModules(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateOrganizationModuleAccessDto,
  ) {
    return this.tenantClient.send(MESSAGE_PATTERNS.ORGANIZATION.UPDATE_MODULE_ACCESS, {
      tenantId,
      modules: dto.modules,
    });
  }

  @Post('organizations/:tenantId/provision/retry')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SuperAdmin: Retry Failed Tenant Database Provisioning' })
  retryProvisioning(@Param('tenantId') tenantId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.TENANT.RETRY_PROVISION, { tenantId });
  }

  @Post('organizations/:tenantId/invitation')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SuperAdmin: Generate Organization Admin Invitation' })
  createAdminInvitation(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateAdminInvitationDto,
  ) {
    return this.tenantClient.send(MESSAGE_PATTERNS.INVITATION.CREATE, { tenantId, dto });
  }

  @Post('organizations/:tenantId/invitation/resend')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'SuperAdmin: Resend / Replace Organization Admin Invitation' })
  resendAdminInvitation(@Param('tenantId') tenantId: string) {
    return this.tenantClient.send(MESSAGE_PATTERNS.INVITATION.RESEND, { tenantId });
  }
}
