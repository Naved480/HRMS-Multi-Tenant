import { Test, TestingModule } from '@nestjs/testing';
import { TenantProvisioningService } from './tenant-provisioning.service';
import { TenantService } from './tenant.service';
import { TenantDatabaseConfigService } from './tenant-database-config.service';
import { TenantConnectionManager } from '@app/tenant-context';
import { OrganizationModuleAccessService } from './organization-module-access.service';
import { OrganizationAdminInvitationService } from './organization-admin-invitation.service';
import { TenantStatus, TenantProvisioningStatus, TenantSetupStatus } from '../models/tenant.model';

describe('TenantProvisioningService - Onboarding Flow', () => {
  let service: TenantProvisioningService;
  let mockTenantService: any;
  let mockModuleAccessService: any;
  let mockInvitationService: any;

  beforeEach(async () => {
    mockTenantService = {
      getTenantByDomainOrSlug: jest.fn().mockResolvedValue(null),
      createTenant: jest.fn().mockImplementation((data) =>
        Promise.resolve({
          id: 'tenant-123',
          ...data,
          update: jest.fn().mockImplementation(function (updates) {
            Object.assign(this, updates);
            return Promise.resolve(this);
          }),
        }),
      ),
      getTenantById: jest.fn().mockResolvedValue({
        id: 'tenant-123',
        name: 'Acme Corp',
        organizationName: 'Acme Corp',
        adminEmail: 'admin@acme.com',
        provisioningStatus: TenantProvisioningStatus.PROVISIONING,
        status: TenantStatus.DRAFT,
        update: jest.fn().mockImplementation(function (updates) {
          Object.assign(this, updates);
          return Promise.resolve(this);
        }),
      }),
    };

    mockModuleAccessService = {
      setOrganizationModules: jest.fn().mockResolvedValue([]),
    };

    mockInvitationService = {
      createAdminInvitation: jest.fn().mockResolvedValue({
        invitationId: 'inv-123',
        tenantId: 'tenant-123',
        adminEmail: 'admin@acme.com',
        rawToken: 'token-xyz',
        activationUrl: 'http://localhost/activate?token=token-xyz',
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantProvisioningService,
        { provide: TenantService, useValue: mockTenantService },
        {
          provide: TenantDatabaseConfigService,
          useValue: { saveOrUpdateTenantDatabaseConfig: jest.fn() },
        },
        {
          provide: TenantConnectionManager,
          useValue: { closeConnection: jest.fn() },
        },
        { provide: OrganizationModuleAccessService, useValue: mockModuleAccessService },
        { provide: OrganizationAdminInvitationService, useValue: mockInvitationService },
      ],
    }).compile();

    service = module.get<TenantProvisioningService>(TenantProvisioningService);

    // Mock internal db provisioning steps to avoid actual database calls in unit test
    jest.spyOn(service, 'provisionTenantDatabase').mockResolvedValue({
      tenantId: 'tenant-123',
      organizationName: 'Acme Corp',
      slug: 'acme-corp',
      databaseName: 'hrms_tenant_123',
      status: TenantStatus.PENDING_ADMIN_ACTIVATION,
      provisioningStatus: TenantProvisioningStatus.READY,
      setupStatus: TenantSetupStatus.NOT_STARTED,
      message: 'Provisioned',
    });
  });

  it('should create organization with initial admin details and modules', async () => {
    const payload = {
      organizationName: 'Acme Corp',
      domain: 'acme-corp',
      adminDetails: {
        firstName: 'Jane',
        lastName: 'Doe',
        workEmail: 'jane@acme.com',
        phone: '+1234567890',
        sendInvitation: true,
      },
      modules: [{ moduleKey: 'employee', enabled: true, allowedActions: ['all'] }],
    };

    const result = await service.createOrganizationAndProvision(payload);

    expect(mockTenantService.createTenant).toHaveBeenCalled();
    expect(mockModuleAccessService.setOrganizationModules).toHaveBeenCalledWith(
      'tenant-123',
      payload.modules,
    );
    expect(mockInvitationService.createAdminInvitation).toHaveBeenCalledWith(
      'tenant-123',
      'jane@acme.com',
      'Jane Doe',
      'SuperAdmin',
      '+1234567890',
      undefined,
    );
    expect(result.status).toBe(TenantStatus.PENDING_ADMIN_ACTIVATION);
    expect(result.invitation).toBeDefined();
  });
});
