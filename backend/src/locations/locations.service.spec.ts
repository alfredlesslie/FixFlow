import { ConflictException } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('LocationsService', () => {
  let service: LocationsService;
  let prismaService: any;
  let auditService: Partial<AuditService>;

  const mockLocation = {
    id: 'loc-1',
    code: 'ENG-101',
    name: 'Lecture Hall 101',
    building: 'Engineering Block',
    floor: '1st Floor',
  };

  beforeEach(() => {
    prismaService = {
      location: {
        findMany: jest.fn().mockResolvedValue([mockLocation]),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'loc-1') return Promise.resolve(mockLocation);
          if (where.code === 'ENG-101') return Promise.resolve(mockLocation);
          return Promise.resolve(null);
        }),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ ...data, id: 'loc-new-1' }),
        ),
      },
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'audit-1' } as any),
    };

    service = new LocationsService(
      prismaService as PrismaService,
      auditService as AuditService,
    );
  });

  it('should retrieve all campus locations', async () => {
    const locations = await service.findAll();
    expect(locations).toHaveLength(1);
    expect(locations[0].code).toBe('ENG-101');
  });

  it('should create a location with unique code', async () => {
    const input = {
      code: 'LIB-201',
      name: 'Library Reading Wing',
      building: 'Central Library',
      floor: '2nd Floor',
    };

    const created = await service.createLocation(input, 'user-mgr-1');
    expect(created.code).toBe('LIB-201');
    expect(auditService.logAction).toHaveBeenCalledWith(
      'user-mgr-1',
      'LOCATION_CREATED',
      'LOCATION',
      'loc-new-1',
      expect.any(Object),
    );
  });

  it('should reject creation with duplicate location code', async () => {
    const input = {
      code: 'ENG-101',
      name: 'Duplicate Hall',
      building: 'Engineering Block',
      floor: '1st Floor',
    };

    await expect(service.createLocation(input, 'user-mgr-1')).rejects.toThrow(
      ConflictException,
    );
  });
});
