import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { OrganizationModuleAccessService } from './organization-module-access.service';
import { OrganizationModuleAccess } from '../models/organization-module-access.model';
import { HRMSModuleKey, ModuleAction } from '@app/common';

describe('OrganizationModuleAccessService', () => {
  let service: OrganizationModuleAccessService;
  let mockModel: any;

  beforeEach(async () => {
    mockModel = {
      upsert: jest.fn().mockImplementation((data) => Promise.resolve([data, true])),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationModuleAccessService,
        {
          provide: getModelToken(OrganizationModuleAccess),
          useValue: mockModel,
        },
      ],
    }).compile();

    service = module.get<OrganizationModuleAccessService>(OrganizationModuleAccessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should save and return organization modules', async () => {
    const tenantId = 'tenant-uuid-1';
    const modules = [
      { moduleKey: HRMSModuleKey.EMPLOYEE, enabled: true, allowedActions: [ModuleAction.ALL] },
      { moduleKey: HRMSModuleKey.PAYROLL, enabled: false, allowedActions: [] },
    ];

    const result = await service.setOrganizationModules(tenantId, modules);
    expect(mockModel.upsert).toHaveBeenCalledTimes(2);
    expect(result.length).toBe(2);
  });

  it('should verify enabled module access', async () => {
    const tenantId = 'tenant-uuid-1';
    mockModel.findOne.mockResolvedValue({
      tenantId,
      moduleKey: 'employee',
      enabled: true,
      allowedActions: ['all', 'create', 'edit'],
    });

    const check = await service.isModuleEnabled(tenantId, 'employee', 'create');
    expect(check.enabled).toBe(true);
    expect(check.allowed).toBe(true);
  });

  it('should deny disabled module access', async () => {
    const tenantId = 'tenant-uuid-1';
    mockModel.findOne.mockResolvedValue({
      tenantId,
      moduleKey: 'payroll',
      enabled: false,
      allowedActions: [],
    });

    const check = await service.isModuleEnabled(tenantId, 'payroll');
    expect(check.enabled).toBe(false);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('disabled');
  });

  it('should check specific disallowed module actions', async () => {
    const tenantId = 'tenant-uuid-1';
    mockModel.findOne.mockResolvedValue({
      tenantId,
      moduleKey: 'employee',
      enabled: true,
      allowedActions: ['create', 'edit'],
    });

    const check = await service.isModuleEnabled(tenantId, 'employee', 'delete');
    expect(check.enabled).toBe(true);
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain("Action 'delete' is not allowed");
  });
});
