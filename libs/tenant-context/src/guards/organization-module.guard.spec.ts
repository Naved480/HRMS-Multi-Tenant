import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { validate } from 'class-validator';
import { OrganizationModuleGuard } from './organization-module.guard';
import { SERVICES, MESSAGE_PATTERNS, TenantException, InitialAdminDetailsDto } from '@app/common';

describe('OrganizationModuleGuard & Authorization Integration', () => {
  let guard: OrganizationModuleGuard;
  let reflector: Reflector;
  let tenantClient: any;

  beforeEach(async () => {
    tenantClient = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationModuleGuard,
        Reflector,
        {
          provide: SERVICES.TENANT_SERVICE,
          useValue: tenantClient,
        },
      ],
    }).compile();

    guard = module.get<OrganizationModuleGuard>(OrganizationModuleGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should allow request if no @RequireModule decorator is set', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);

    const context: any = {
      getHandler: () => {},
      getClass: () => {},
    };

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('Scenario 1 & 4: should deny disabled module (e.g. Payroll=DISABLED) even if Admin has Manage permission', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'require_module') {
        return { moduleKey: 'payroll', action: 'manage' };
      }
      return false;
    });

    tenantClient.send.mockReturnValue(
      of({ enabled: false, allowed: false, reason: "Module 'payroll' is disabled for this organization." }),
    );

    const context: any = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({
          tenantId: 'tenant-org-a',
          user: { id: 'admin-1', role: 'Admin', permissions: ['payroll:manage'], tenantId: 'tenant-org-a' },
          headers: { 'x-tenant-id': 'tenant-org-a' },
        }),
      }),
    };

    await expect(guard.canActivate(context)).rejects.toThrow(TenantException);
    expect(tenantClient.send).toHaveBeenCalledWith(
      MESSAGE_PATTERNS.ORGANIZATION.CHECK_MODULE_ACCESS,
      {
        tenantId: 'tenant-org-a',
        moduleKey: 'payroll',
        action: 'manage',
      },
    );
  });

  it('Scenario 2: should allow enabled module with allowed action', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'require_module') {
        return { moduleKey: 'employee', action: 'create' };
      }
      return false;
    });

    tenantClient.send.mockReturnValue(
      of({ enabled: true, allowed: true }),
    );

    const context: any = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({
          tenantId: 'tenant-org-a',
          user: { id: 'admin-1', role: 'Admin', tenantId: 'tenant-org-a' },
          headers: { 'x-tenant-id': 'tenant-org-a' },
        }),
      }),
    };

    const canActivate = await guard.canActivate(context);
    expect(canActivate).toBe(true);
  });

  it('Scenario 5 (Cross-Tenant): should use authenticated JWT user tenantId over untrusted request header', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === 'require_module') {
        return { moduleKey: 'employee', action: 'all' };
      }
      return false;
    });

    tenantClient.send.mockReturnValue(of({ enabled: true, allowed: true }));

    const context: any = {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({
          tenantId: 'tenant-org-a', // Resolved from JWT by TenantGuard
          user: { id: 'user-1', tenantId: 'tenant-org-a' },
          headers: { 'x-tenant-id': 'tenant-org-b' }, // Untrusted header forgery attempt
        }),
      }),
    };

    await guard.canActivate(context);
    expect(tenantClient.send).toHaveBeenCalledWith(
      MESSAGE_PATTERNS.ORGANIZATION.CHECK_MODULE_ACCESS,
      {
        tenantId: 'tenant-org-a',
        moduleKey: 'employee',
        action: 'all',
      },
    );
  });

  it('Issue 2: should validate InitialAdminDetailsDto with jobTitle and initialDepartment', async () => {
    const dto = new InitialAdminDetailsDto();
    dto.firstName = 'John';
    dto.lastName = 'Doe';
    dto.workEmail = 'john.doe@acme.com';
    dto.jobTitle = 'HR Director';
    dto.initialDepartment = 'Human Resources';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.jobTitle).toBe('HR Director');
    expect(dto.initialDepartment).toBe('Human Resources');
  });
});
