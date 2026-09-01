import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ClientProxy } from '@nestjs/microservices';
import * as crypto from 'crypto';
import { firstValueFrom, timeout } from 'rxjs';
import {
  SERVICES,
  MESSAGE_PATTERNS,
  TenantException,
  TenantErrorCode,
} from '@app/common';
import { OrganizationAdminInvitation, InvitationStatus } from '../models/organization-admin-invitation.model';
import { Tenant, TenantStatus, TenantSetupStatus, TenantProvisioningStatus } from '../models/tenant.model';
import { TenantService } from './tenant.service';

export interface AdminInvitationResult {
  invitationId: string;
  tenantId: string;
  adminEmail: string;
  adminName?: string;
  rawToken: string;
  activationUrl: string;
  expiresAt: Date;
  status: InvitationStatus;
}

@Injectable()
export class OrganizationAdminInvitationService {
  private readonly logger = new Logger(OrganizationAdminInvitationService.name);

  constructor(
    @InjectModel(OrganizationAdminInvitation)
    private invitationModel: typeof OrganizationAdminInvitation,
    private tenantService: TenantService,
    @Inject(SERVICES.AUTH_SERVICE) private readonly authClient: ClientProxy,
    @Inject(SERVICES.USER_SERVICE) private readonly userClient: ClientProxy,
  ) {}

  /**
   * Hash a raw invitation token safely using SHA-256 (Phase F)
   */
  private hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Create an Organization Admin Invitation (Phase E, F)
   */
  async createAdminInvitation(
    tenantId: string,
    adminEmail?: string,
    adminName?: string,
    createdBy?: string,
    phone?: string,
    customMessage?: string,
  ): Promise<AdminInvitationResult> {
    const tenant = await this.tenantService.getTenantById(tenantId);

    if (tenant.provisioningStatus !== TenantProvisioningStatus.READY) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        `Cannot invite Admin. Organization database provisioning status is '${tenant.provisioningStatus}'. Database must be READY.`,
      );
    }

    const targetEmail = adminEmail || tenant.adminEmail || tenant.email;
    if (!targetEmail) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        'Admin email is required to generate an invitation.',
      );
    }

    // Cancel existing PENDING invitations for this tenant
    await this.invitationModel.update(
      { status: InvitationStatus.CANCELLED, cancelledAt: new Date() },
      { where: { tenantId, status: InvitationStatus.PENDING } },
    );

    // Cryptographically secure token generation (Phase F)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days Expiry

    const invitation = await this.invitationModel.create({
      tenantId: tenant.id,
      adminEmail: targetEmail,
      adminName: adminName || tenant.name,
      phone,
      customMessage,
      tokenHash,
      status: InvitationStatus.PENDING,
      expiresAt,
      createdBy,
    });

    const activationUrl = `http://localhost:3000/api/v1/organization-admin/activate?token=${rawToken}`;
    this.logger.log(`Created Admin Invitation for tenant ${tenant.id} (${targetEmail}).`);

    return {
      invitationId: invitation.id,
      tenantId: tenant.id,
      adminEmail: targetEmail,
      adminName: invitation.adminName,
      rawToken,
      activationUrl,
      expiresAt,
      status: InvitationStatus.PENDING,
    };
  }

  /**
   * Resend / Replace Admin Invitation (Phase L)
   */
  async resendAdminInvitation(tenantId: string): Promise<AdminInvitationResult> {
    const tenant = await this.tenantService.getTenantById(tenantId);
    return this.createAdminInvitation(tenant.id, tenant.adminEmail, tenant.organizationName || tenant.name);
  }

  /**
   * Validate Invitation Token (Phase G)
   */
  async validateInvitationToken(rawToken: string) {
    if (!rawToken) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        'Invitation token is required.',
      );
    }

    const tokenHash = this.hashToken(rawToken);
    const invitation = await this.invitationModel.findOne({
      where: { tokenHash },
      include: [Tenant],
    });

    if (!invitation) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        'Invalid or non-existent invitation token.',
      );
    }

    if (invitation.status === InvitationStatus.ACCEPTED) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        'This invitation has already been accepted and activated.',
      );
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        `Invitation is no longer valid. Status is '${invitation.status}'.`,
      );
    }

    // Check expiry
    if (new Date() > new Date(invitation.expiresAt)) {
      await invitation.update({ status: InvitationStatus.EXPIRED });
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        'Invitation token has expired. Please request a new invitation from your platform administrator.',
      );
    }

    const tenant = invitation.tenant;
    if (!tenant || tenant.provisioningStatus !== TenantProvisioningStatus.READY) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        'Organization database is not ready for activation.',
      );
    }

    return {
      isValid: true,
      invitationId: invitation.id,
      tenantId: tenant.id,
      organizationName: tenant.organizationName || tenant.name,
      adminEmail: invitation.adminEmail,
      adminName: invitation.adminName,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Activate Admin Account (Phase H, I, J, K, P)
   */
  async activateAdminAccount(data: {
    token: string;
    password: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
  }) {
    if (data.confirmPassword && data.password !== data.confirmPassword) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        'Password and confirm password do not match.',
      );
    }

    // Step 1: Validate Token
    await this.validateInvitationToken(data.token);

    const tokenHash = this.hashToken(data.token);
    const invitation = await this.invitationModel.findOne({
      where: { tokenHash },
      include: [Tenant],
    });

    if (!invitation || invitation.status !== InvitationStatus.PENDING) {
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        'Invitation is not valid for activation.',
      );
    }

    const tenant = invitation.tenant;

    // Step 2: Create Admin User in Tenant Database via User Service (TCP)
    try {
      await firstValueFrom(
        this.userClient
          .send(MESSAGE_PATTERNS.USER.CREATE_ORGANIZATION_ADMIN, {
            tenantId: tenant.id,
            email: invitation.adminEmail,
            firstName: data.firstName || invitation.adminName || 'Admin',
            lastName: data.lastName || '',
          })
          .pipe(timeout(10000)),
      );
    } catch (err: any) {
      this.logger.error(`Failed to create Admin User in User Service: ${err.message}`);
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        `User creation failed: ${err.message}`,
      );
    }

    // Step 3: Create Auth Credentials via Auth Service (TCP)
    try {
      await firstValueFrom(
        this.authClient
          .send(MESSAGE_PATTERNS.AUTH.CREATE_ADMIN_CREDENTIAL, {
            email: invitation.adminEmail,
            password: data.password,
            tenantId: tenant.id,
            tenantName: tenant.organizationName || tenant.name,
            role: 'Admin',
          })
          .pipe(timeout(10000)),
      );
    } catch (err: any) {
      this.logger.error(`Failed to create Auth Credentials in Auth Service: ${err.message}`);
      throw new TenantException(
        TenantErrorCode.INVALID_TENANT_CONTEXT,
        `Auth credential creation failed: ${err.message}`,
      );
    }

    // Step 4: Mark Invitation ACCEPTED
    await invitation.update({
      status: InvitationStatus.ACCEPTED,
      acceptedAt: new Date(),
    });

    // Step 5: Transition Tenant Lifecycle to SETUP_IN_PROGRESS (Phase P)
    await tenant.update({
      status: TenantStatus.SETUP_IN_PROGRESS,
      setupStatus: TenantSetupStatus.IN_PROGRESS,
      provisioningStatus: TenantProvisioningStatus.READY,
    });

    this.logger.log(
      `Organization Admin (${invitation.adminEmail}) activated for tenant ${tenant.id}. Tenant status: SETUP_IN_PROGRESS.`,
    );

    return {
      message:
        'Organization Admin account activated successfully. Please log in to complete your organization setup.',
      tenantId: tenant.id,
      adminEmail: invitation.adminEmail,
      status: TenantStatus.SETUP_IN_PROGRESS,
      setupStatus: TenantSetupStatus.IN_PROGRESS,
      provisioningStatus: TenantProvisioningStatus.READY,
    };
  }
}
