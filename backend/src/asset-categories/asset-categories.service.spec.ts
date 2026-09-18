import { ConflictException } from '@nestjs/common';
import { AssetCategoriesService } from './asset-categories.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('AssetCategoriesService', () => {
  let service: AssetCategoriesService;
  let prismaService: any;
  let auditService: Partial<AuditService>;

  const mockCategory = {
    id: 'cat-1',
    code: 'HVAC',
    name: 'Heating, Ventilation & AC',
    defaultMaintenanceIntervalDays: 90,
  };

  beforeEach(() => {
    prismaService = {
      assetCategory: {
        findMany: jest.fn().mockResolvedValue([mockCategory]),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'cat-1') return Promise.resolve(mockCategory);
          if (where.code === 'HVAC') return Promise.resolve(mockCategory);
          if (where.name === 'Heating, Ventilation & AC') return Promise.resolve(mockCategory);
          return Promise.resolve(null);
        }),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ ...data, id: 'cat-new-1' }),
        ),
      },
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-1' } as any),
    };

    service = new AssetCategoriesService(
      prismaService as PrismaService,
      auditService as AuditService,
    );
  });

  it('should retrieve all categories', async () => {
    const categories = await service.findAll();
    expect(categories).toHaveLength(1);
    expect(categories[0].code).toBe('HVAC');
  });

  it('should create an asset category with unique code and name', async () => {
    const input = {
      code: 'PLUMBING',
      name: 'Plumbing & Water Systems',
      defaultMaintenanceIntervalDays: 45,
    };

    const created = await service.createCategory(input, 'user-mgr-1');
    expect(created.code).toBe('PLUMBING');
    expect(auditService.logAction).toHaveBeenCalledWith(
      'user-mgr-1',
      'CATEGORY_CREATED',
      'ASSET_CATEGORY',
      'cat-new-1',
      expect.any(Object),
    );
  });

  it('should reject creation with duplicate category code', async () => {
    const input = {
      code: 'HVAC',
      name: 'Different HVAC Name',
    };

    await expect(service.createCategory(input, 'user-mgr-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('should reject creation with duplicate category name', async () => {
    const input = {
      code: 'HVAC_NEW',
      name: 'Heating, Ventilation & AC',
    };

    await expect(service.createCategory(input, 'user-mgr-1')).rejects.toThrow(
      ConflictException,
    );
  });
});
