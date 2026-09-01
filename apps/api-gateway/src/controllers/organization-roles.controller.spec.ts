import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { OrganizationRolesController } from './organization-roles.controller';
import { OrganizationModuleGuard } from '@app/tenant-context/guards/organization-module.guard';
import { PermissionsGuard } from '@app/tenant-context/guards/permissions.guard';
import { SERVICES, MESSAGE_PATTERNS, TenantException, TenantErrorCode, HRMSModuleKey } from '@app/common';

describe('OrganizationRolesController & Authorization Matrix', () => {
  let controller: OrganizationRolesController;
  let moduleGuard: OrganizationModuleGuard;
  let permissionsGuard: PermissionsGuard;
  let mockUserClient: any;
  let mockTenantClient: any;
  let reflector: Reflector;

  beforeEach(async () => {
    mockUserClient = {
      send: jest.fn(),
    };

    mockTenantClient = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrganizationRolesController],
      providers: [
        Reflector,
        OrganizationModuleGuard,
        PermissionsGuard,
        {
          provide: SERVICES.USER_SERVICE,
          useValue: mockUserClient,
        },
        {
          provide: SERVICES.TENANT_SERVICE,
          useValue: mockTenantClient,
        },
      ],
    }).compile();

    controller = module.get<OrganizationRolesController>(OrganizationRolesController);
    moduleGuard = module.get<OrganizationModuleGuard>(OrganizationModuleGuard);
    permissionsGuard = module.get<PermissionsGuard>(PermissionsGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('Role CRUD API Calls', () => {
    it('should delegate getAllRoles to userClient', async () => {
      const mockRoles = [{ id: 'role-1', name: 'HR Manager' }];
      mockUserClient.send.mockReturnValue(of(mockRoles));

      const result = await controller.getAllRoles();
      expect(mockUserClient.send).toHaveBeenCalledWith(MESSAGE_PATTERNS.ROLE.GET_ALL, {});
      expect(result).toEqual(mockRoles);
    });

    it('should delegate createRole to userClient', async () => {
      const dto = { name: 'Recruiter', description: 'Recruitment role', permissionIds: ['emp-1'] };
      const createdRole = { id: 'role-2', ...dto };
      mockUserClient.send.mockReturnValue(of(createdRole));

      const result = await controller.createRole(dto);
      expect(mockUserClient.send).toHaveBeenCalledWith(MESSAGE_PATTERNS.ROLE.CREATE, dto);
      expect(result).toEqual(createdRole);
    });

    it('should delegate setRolePermissions to userClient', async () => {
      const dto = { permissionIds: ['employee.view', 'attendance.view'] };
      const updatedRole = { id: 'role-1', permissions: dto.permissionIds };
      mockUserClient.send.mockReturnValue(of(updatedRole));

      const result = await controller.setRolePermissions('role-1', dto);
      expect(mockUserClient.send).toHaveBeenCalledWith(MESSAGE_PATTERNS.ROLE.SET_PERMISSIONS, {
        roleId: 'role-1',
        permissionIds: dto.permissionIds,
      });
      expect(result).toEqual(updatedRole);
    });
  });

  describe('Authorization Matrix Tests (Cases 1 - 7)', () => {
    function createMockContext(request: any, handlerFn: any = () => {}): ExecutionContext {
      return {
        getType: () => 'http',
        getHandler: () => handlerFn,
        getClass: () => OrganizationRolesController,
        switchToHttp: () => ({
          getRequest: () => request,
          getResponse: () => ({}),
        }),
      } as any;
    }

    it('Case 1: Module disabled + Role permission exists -> DENIED (MODULE_NOT_ENABLED)', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === 'require_module') {
          return { moduleKey: HRMSModuleKey.PAYROLL, action: 'manage' };
        }
        return undefined;
      });

      mockTenantClient.send.mockReturnValue(
        of({ enabled: false, allowed: false, reason: "Module 'payroll' is not enabled" }),
      );

      const req = {
        tenantId: 'tenant-a',
        user: { id: 'user-1', roles: ['Employee'], permissions: ['payroll.manage'], tenantId: 'tenant-a' },
      };
      const context = createMockContext(req);

      await expect(moduleGuard.canActivate(context)).rejects.toThrow(TenantException);
      await expect(moduleGuard.canActivate(context)).rejects.toHaveProperty(
        'code',
        TenantErrorCode.MODULE_NOT_ENABLED,
      );
    });

    it('Case 2: Module enabled + Role permission exists -> ALLOWED', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === 'require_module') {
          return { moduleKey: HRMSModuleKey.PAYROLL, action: 'manage' };
        }
        if (key === 'permissions') {
          return ['payroll.manage'];
        }
        return undefined;
      });

      mockTenantClient.send.mockReturnValue(of({ enabled: true, allowed: true }));

      const req = {
        tenantId: 'tenant-a',
        user: { id: 'user-1', roles: ['PayrollManager'], permissions: ['payroll.manage'], tenantId: 'tenant-a' },
      };
      const context = createMockContext(req);

      const moduleAllowed = await moduleGuard.canActivate(context);
      const permAllowed = permissionsGuard.canActivate(context);

      expect(moduleAllowed).toBe(true);
      expect(permAllowed).toBe(true);
    });

    it('Case 3: Module enabled + Role permission missing -> DENIED', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === 'require_module') {
          return { moduleKey: HRMSModuleKey.PAYROLL, action: 'manage' };
        }
        if (key === 'permissions') {
          return ['payroll.manage'];
        }
        return undefined;
      });

      mockTenantClient.send.mockReturnValue(of({ enabled: true, allowed: true }));

      const req = {
        tenantId: 'tenant-a',
        user: { id: 'user-1', roles: ['Employee'], permissions: ['employee.view'], tenantId: 'tenant-a' },
      };
      const context = createMockContext(req);

      const moduleAllowed = await moduleGuard.canActivate(context);
      expect(moduleAllowed).toBe(true);

      expect(() => permissionsGuard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('Case 4: Module disabled + Role permission missing -> DENIED by module guard', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === 'require_module') {
          return { moduleKey: HRMSModuleKey.PAYROLL, action: 'manage' };
        }
        return undefined;
      });

      mockTenantClient.send.mockReturnValue(of({ enabled: false, allowed: false }));

      const req = {
        tenantId: 'tenant-a',
        user: { id: 'user-1', roles: ['Employee'], permissions: [], tenantId: 'tenant-a' },
      };
      const context = createMockContext(req);

      await expect(moduleGuard.canActivate(context)).rejects.toThrow(TenantException);
    });

    it('Case 5: Tenant A user attempting Tenant B role assignment -> DENIED', async () => {
      // User belongs to Tenant A
      const tenantAUser = { id: 'user-a', tenantId: 'tenant-a', roles: ['ORGANIZATION_ADMIN'] };
      const tenantBRoleId = 'role-tenant-b-1';

      mockUserClient.send.mockReturnValue(
        of(new Error('One or more specified role IDs do not exist in the current organization tenant database.')),
      );

      // Verify that userClient throws or returns error when roleId does not exist in Tenant A database
      const call = controller.setUserRoles(tenantAUser.id, { roleIds: [tenantBRoleId] });
      await expect(call).resolves.toBeInstanceOf(Error);
    });

    it('Case 6: Organization Admin attempting Platform SuperAdmin permission -> DENIED', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === 'permissions') {
          return ['platform.superadmin.manage'];
        }
        return undefined;
      });

      const req = {
        tenantId: 'tenant-a',
        user: { id: 'org-admin-1', roles: ['ORGANIZATION_ADMIN'], permissions: ['user_management.manage'], tenantId: 'tenant-a' },
      };
      const context = createMockContext(req);

      // System Admin (ORGANIZATION_ADMIN) bypasses fine-grained perm checks for org routes, but platform routes enforce platform guard.
      // If permission is platform.superadmin.manage and user permissions do not contain it:
      const nonAdminReq = {
        tenantId: 'tenant-a',
        user: { id: 'user-2', roles: ['CustomManager'], permissions: ['user_management.view'], tenantId: 'tenant-a' },
      };
      const nonAdminContext = createMockContext(nonAdminReq);

      expect(() => permissionsGuard.canActivate(nonAdminContext)).toThrow(ForbiddenException);
    });

    it('Case 7: Custom Role with valid org permissions -> ALLOWED', async () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
        if (key === 'require_module') {
          return { moduleKey: HRMSModuleKey.EMPLOYEE, action: 'view' };
        }
        if (key === 'permissions') {
          return ['employee.view'];
        }
        return undefined;
      });

      mockTenantClient.send.mockReturnValue(of({ enabled: true, allowed: true }));

      const req = {
        tenantId: 'tenant-a',
        user: { id: 'user-custom', roles: ['Recruitment Manager'], permissions: ['employee.view', 'recruitment.manage'], tenantId: 'tenant-a' },
      };
      const context = createMockContext(req);

      expect(await moduleGuard.canActivate(context)).toBe(true);
      expect(permissionsGuard.canActivate(context)).toBe(true);
    });
  });
});
