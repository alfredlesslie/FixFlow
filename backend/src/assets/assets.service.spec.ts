import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AssetStatus, Criticality } from '../common/enums';

describe('AssetsService', () => {
  let assetsService: AssetsService;
  let prismaService: any;
  let auditService: Partial<AuditService>;

  const mockCategory = {
    id: 'cat-hvac-1',
    code: 'HVAC',
    name: 'Heating, Ventilation & AC',
  };

  const mockLocation = {
    id: 'loc-eng-1',
    code: 'ENG-101',
    name: 'Lecture Hall 101',
  };

  const mockAsset = {
    id: 'ast-1',
    assetTag: 'AST-AC-001',
    name: 'Daikin AC',
    categoryId: 'cat-hvac-1',
    locationId: 'loc-eng-1',
    status: AssetStatus.OPERATIONAL,
    criticality: Criticality.HIGH,
    conditionRating: 5,
    qrIdentifier: 'fixflow://assets/AST-AC-001',
    category: mockCategory,
    location: mockLocation,
  };

  beforeEach(() => {
    prismaService = {
      asset: {
        findMany: jest.fn().mockResolvedValue([mockAsset]),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'ast-1') return Promise.resolve(mockAsset);
          if (where.assetTag === 'AST-AC-001') return Promise.resolve(mockAsset);
          if (where.assetTag === 'AST-EXISTING') return Promise.resolve(mockAsset);
          return Promise.resolve(null);
        }),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            ...data,
            id: 'ast-new-1',
            category: mockCategory,
            location: mockLocation,
          }),
        ),
        update: jest.fn().mockImplementation(({ data, where }) =>
          Promise.resolve({
            ...mockAsset,
            ...data,
            id: where.id,
          }),
        ),
      },
      assetCategory: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'cat-hvac-1') return Promise.resolve(mockCategory);
          return Promise.resolve(null);
        }),
      },
      location: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'loc-eng-1') return Promise.resolve(mockLocation);
          return Promise.resolve(null);
        }),
      },
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-1' } as any),
    };

    assetsService = new AssetsService(
      prismaService as PrismaService,
      auditService as AuditService,
    );
  });

  it('should create an asset with valid location and category', async () => {
    const input = {
      assetTag: 'AST-NEW-01',
      name: 'New Split AC',
      categoryId: 'cat-hvac-1',
      locationId: 'loc-eng-1',
      status: AssetStatus.OPERATIONAL,
      criticality: Criticality.MEDIUM,
      conditionRating: 5,
    };

    const result = await assetsService.createAsset(input, 'user-mgr-1');

    expect(result).toBeDefined();
    expect(result.assetTag).toBe('AST-NEW-01');
    expect(prismaService.asset.create).toHaveBeenCalled();
    expect(auditService.logAction).toHaveBeenCalledWith(
      'user-mgr-1',
      'ASSET_CREATED',
      'ASSET',
      'ast-new-1',
      expect.any(Object),
    );
  });

  it('should reject asset creation when category does not exist', async () => {
    const input = {
      assetTag: 'AST-NEW-02',
      name: 'New Split AC',
      categoryId: 'non-existent-cat',
      locationId: 'loc-eng-1',
    };

    await expect(assetsService.createAsset(input, 'user-mgr-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject asset creation when location does not exist', async () => {
    const input = {
      assetTag: 'AST-NEW-03',
      name: 'New Split AC',
      categoryId: 'cat-hvac-1',
      locationId: 'non-existent-loc',
    };

    await expect(assetsService.createAsset(input, 'user-mgr-1')).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject asset creation with duplicate asset tag', async () => {
    const input = {
      assetTag: 'AST-EXISTING',
      name: 'Duplicate Tag AC',
      categoryId: 'cat-hvac-1',
      locationId: 'loc-eng-1',
    };

    await expect(assetsService.createAsset(input, 'user-mgr-1')).rejects.toThrow(
      ConflictException,
    );
  });

  it('should retrieve asset by tag', async () => {
    const asset = await assetsService.findByTag('AST-AC-001');
    expect(asset).toBeDefined();
    expect(asset.assetTag).toBe('AST-AC-001');
  });

  it('should throw NotFoundException when asset by tag is missing', async () => {
    await expect(assetsService.findByTag('NON-EXISTENT-TAG')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should update asset status and record audit log', async () => {
    const updated = await assetsService.updateAssetStatus(
      'ast-1',
      AssetStatus.UNDER_MAINTENANCE,
      'tech-user-1',
    );

    expect(updated.status).toBe(AssetStatus.UNDER_MAINTENANCE);
    expect(auditService.logAction).toHaveBeenCalledWith(
      'tech-user-1',
      'ASSET_STATUS_CHANGED',
      'ASSET',
      'ast-1',
      expect.any(Object),
    );
  });
});
