import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { RequestsService, SAFETY_CRITICAL_KEYWORDS } from './requests.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Role, AccountStatus, Priority, RequestStatus, Criticality } from '../common/enums';
import { User } from '../users/models/user.model';

describe('RequestsService', () => {
  let requestsService: RequestsService;
  let prismaService: any;
  let auditService: Partial<AuditService>;

  const mockRequesterUser: User = {
    id: 'usr-req-101',
    email: 'student.riya@fixflow.edu',
    firstName: 'Riya',
    lastName: 'Sharma',
    name: 'Riya Sharma',
    role: Role.REQUESTER,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    tokenVersion: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSuspendedUser: User = {
    ...mockRequesterUser,
    id: 'usr-suspended',
    status: AccountStatus.SUSPENDED,
  };

  const mockLocation = {
    id: 'loc-eng-101',
    code: 'ENG-BLD-101',
    name: 'Engineering Block - Room 101',
    building: 'Engineering Block',
    floor: '1st Floor',
  };

  const mockAsset = {
    id: 'ast-ac-01',
    assetTag: 'AST-AC-ENG-101',
    name: 'Daikin 2.0 Ton Split AC',
    locationId: 'loc-eng-101',
    categoryId: 'cat-hvac-01',
    criticality: Criticality.HIGH,
  };

  const mockRequestRecord = {
    id: 'req-uuid-1',
    requestNumber: 'REQ-2026-0001',
    title: 'AC leaking water onto floor',
    description: 'Continuous condensation drip from lower pan',
    requesterId: mockRequesterUser.id,
    locationId: mockLocation.id,
    assetId: mockAsset.id,
    priority: Priority.HIGH,
    status: RequestStatus.OPEN,
    slaTargetHours: 8,
    slaDeadline: new Date(Date.now() + 8 * 3600 * 1000),
    slaBreached: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    requester: mockRequesterUser,
    location: mockLocation,
    asset: mockAsset,
  };

  beforeEach(() => {
    prismaService = {
      maintenanceRequest: {
        findMany: jest.fn().mockResolvedValue([mockRequestRecord]),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'req-uuid-1') return Promise.resolve(mockRequestRecord);
          return Promise.resolve(null);
        }),
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            ...data,
            id: 'req-new-uuid',
            requester: mockRequesterUser,
            location: mockLocation,
            asset: mockAsset,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
        count: jest.fn().mockResolvedValue(1),
      },
      location: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === mockLocation.id) return Promise.resolve(mockLocation);
          return Promise.resolve(null);
        }),
      },
      asset: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === mockAsset.id) return Promise.resolve(mockAsset);
          return Promise.resolve(null);
        }),
      },
      auditLog: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue({ id: 'aud-uuid-1' }),
      },
      requestVote: {
        create: jest.fn().mockResolvedValue({ id: 'vote-1', requestId: 'req-uuid-1', userId: mockRequesterUser.id }),
        findUnique: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        delete: jest.fn().mockResolvedValue({ id: 'vote-1' }),
      },
      requestDuplicate: {
        create: jest.fn().mockResolvedValue({ id: 'dup-link-1' }),
        upsert: jest.fn().mockResolvedValue({ id: 'dup-link-1' }),
        findUnique: jest.fn().mockResolvedValue(null),
        delete: jest.fn().mockResolvedValue({ id: 'dup-link-1' }),
      },
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue({ id: 'aud-uuid-1' } as any),
    };

    requestsService = new RequestsService(
      prismaService as PrismaService,
      auditService as AuditService,
    );
  });

  describe('Authenticated Request Creation & Ownership', () => {
    it('should create a maintenance request with ownership strictly bound to the authenticated JWT user', async () => {
      const input = {
        title: 'AC leaking water onto floor',
        description: 'Continuous condensation drip from lower pan',
        locationId: mockLocation.id,
        assetId: mockAsset.id,
        initialSeverity: 7,
      };

      const result = await requestsService.create(input, mockRequesterUser);

      expect(result).toBeDefined();
      expect(result.title).toBe(input.title);
      expect(prismaService.maintenanceRequest.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requesterId: mockRequesterUser.id,
            locationId: mockLocation.id,
            assetId: mockAsset.id,
            status: RequestStatus.OPEN,
          }),
        }),
      );
      expect(auditService.logAction).toHaveBeenCalledWith(
        mockRequesterUser.id,
        'REQUEST_CREATED',
        'MAINTENANCE_REQUEST',
        'req-new-uuid',
        expect.objectContaining({
          requestNumber: expect.stringMatching(/^REQ-\d{4}-\d{4}$/),
        }),
      );
    });

    it('should prevent inactive or suspended users from submitting requests', async () => {
      const input = {
        title: 'Unauthorized test request',
        description: 'Should fail due to account status',
        locationId: mockLocation.id,
      };

      await expect(requestsService.create(input, mockSuspendedUser)).rejects.toThrow(
        ForbiddenException,
      );
      expect(prismaService.maintenanceRequest.create).not.toHaveBeenCalled();
    });
  });

  describe('Invalid References Validation', () => {
    it('should throw NotFoundException when locationId does not exist in database', async () => {
      const input = {
        title: 'Invalid location test',
        description: 'Should fail with 404 for location',
        locationId: 'loc-non-existent',
      };

      await expect(requestsService.create(input, mockRequesterUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(requestsService.create(input, mockRequesterUser)).rejects.toThrow(
        /Location with ID "loc-non-existent" not found/,
      );
      expect(prismaService.maintenanceRequest.create).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when assetId does not exist in database', async () => {
      const input = {
        title: 'Invalid asset test',
        description: 'Should fail with 404 for asset',
        locationId: mockLocation.id,
        assetId: 'ast-non-existent',
      };

      await expect(requestsService.create(input, mockRequesterUser)).rejects.toThrow(
        NotFoundException,
      );
      await expect(requestsService.create(input, mockRequesterUser)).rejects.toThrow(
        /Asset with ID "ast-non-existent" not found/,
      );
      expect(prismaService.maintenanceRequest.create).not.toHaveBeenCalled();
    });
  });

  describe('Server-Side Priority & SLA Derivation', () => {
    it('should derive LOW priority and 72-hour SLA for low severity routine requests', () => {
      const { priority, slaTargetHours } = requestsService.derivePriorityAndSLA(
        2,
        'Flickering light bulb',
        'Bulb flickers occasionally in hallway',
        Criticality.LOW,
      );

      expect(priority).toBe(Priority.LOW);
      expect(slaTargetHours).toBe(72);
    });

    it('should derive MEDIUM priority and 24-hour SLA for standard moderate requests', () => {
      const { priority, slaTargetHours } = requestsService.derivePriorityAndSLA(
        5,
        'Door latch loose',
        'Classroom door handle requires tightening',
        Criticality.MEDIUM,
      );

      expect(priority).toBe(Priority.MEDIUM);
      expect(slaTargetHours).toBe(24);
    });

    it('should derive HIGH priority and 8-hour SLA for high severity or critical asset requests', () => {
      const { priority, slaTargetHours } = requestsService.derivePriorityAndSLA(
        7,
        'Main water line low pressure',
        'Restroom facilities pressure significantly reduced',
        Criticality.HIGH,
      );

      expect(priority).toBe(Priority.HIGH);
      expect(slaTargetHours).toBe(8);
    });

    it('should automatically assign CRITICAL priority and 2-hour SLA when initial severity is 9 or above', () => {
      const { priority, slaTargetHours } = requestsService.derivePriorityAndSLA(
        9,
        'Server room cooling failure',
        'Ambient temperature rapidly climbing above 35C',
        Criticality.CRITICAL,
      );

      expect(priority).toBe(Priority.CRITICAL);
      expect(slaTargetHours).toBe(2);
    });

    it('should automatically escalate to CRITICAL priority and 2-hour SLA for safety-critical hazards regardless of low reported severity', () => {
      // User reported low severity (1), but text includes "exposed wire" and "sparking"
      const { priority, slaTargetHours, isSafetyCritical } = requestsService.derivePriorityAndSLA(
        1,
        'Exposed wire sparking near water fountain',
        'Live electrical contact visible, immediate danger of shock',
      );

      expect(isSafetyCritical).toBe(true);
      expect(priority).toBe(Priority.CRITICAL);
      expect(slaTargetHours).toBe(2);
    });

    it('should detect all safety critical keywords', () => {
      for (const kw of SAFETY_CRITICAL_KEYWORDS) {
        const { isSafetyCritical, priority } = requestsService.derivePriorityAndSLA(
          3,
          `Hazard detected: ${kw}`,
          `Notice of urgent hazard: ${kw}`,
        );
        expect(isSafetyCritical).toBe(true);
        expect(priority).toBe(Priority.CRITICAL);
      }
    });
  });

  describe('Request Filtering & Detail Retrieval', () => {
    it('should return persisted requests with upvote aggregation', async () => {
      prismaService.requestVote.findMany.mockResolvedValueOnce([
        { requestId: 'req-uuid-1', userId: mockRequesterUser.id },
      ]);

      const results = await requestsService.findAll(undefined, mockRequesterUser);

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('req-uuid-1');
      expect(results[0].upvotesCount).toBe(1);
      expect(results[0].hasUpvoted).toBe(true);
    });

    it('should support multi-criteria filtering by status, priority, and text search', async () => {
      await requestsService.findAll(
        {
          search: 'leaking',
          status: RequestStatus.OPEN,
          priority: Priority.HIGH,
          locationId: mockLocation.id,
        },
        mockRequesterUser,
      );

      expect(prismaService.maintenanceRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: RequestStatus.OPEN,
            priority: Priority.HIGH,
            locationId: mockLocation.id,
            OR: [
              { title: { contains: 'leaking', mode: 'insensitive' } },
              { description: { contains: 'leaking', mode: 'insensitive' } },
              { requestNumber: { contains: 'leaking', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should filter by myReportsOnly correctly', async () => {
      await requestsService.findAll(
        { myReportsOnly: true },
        mockRequesterUser,
      );

      expect(prismaService.maintenanceRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            requesterId: mockRequesterUser.id,
          }),
        }),
      );
    });

    it('should retrieve request by unique ID with full relation payload', async () => {
      const result = await requestsService.findById('req-uuid-1', mockRequesterUser);

      expect(result).toBeDefined();
      expect(result.id).toBe('req-uuid-1');
      expect(result.requester.id).toBe(mockRequesterUser.id);
      expect(result.location.id).toBe(mockLocation.id);
    });

    it('should throw NotFoundException when request ID does not exist', async () => {
      await expect(requestsService.findById('req-not-found')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('Upvote Behavior & Duplicate Prevention (Relational RequestVote)', () => {
    it('should register an upvote via RequestVote and record an audit log when user has not yet upvoted', async () => {
      const result = await requestsService.upvote('req-uuid-1', mockRequesterUser);

      expect(result).toBeDefined();
      expect(prismaService.requestVote.create).toHaveBeenCalledWith({
        data: {
          requestId: 'req-uuid-1',
          userId: mockRequesterUser.id,
        },
      });
      expect(auditService.logAction).toHaveBeenCalledWith(
        mockRequesterUser.id,
        'REQUEST_UPVOTED',
        'MAINTENANCE_REQUEST',
        'req-uuid-1',
        expect.objectContaining({
          voterId: mockRequesterUser.id,
        }),
      );
    });

    it('should throw ConflictException on database-level unique constraint failure (P2002)', async () => {
      // Simulate Prisma P2002 unique constraint failure
      prismaService.requestVote.create.mockRejectedValue({
        code: 'P2002',
        message: 'Unique constraint failed on the fields: (`requestId`,`userId`)',
      });

      await expect(requestsService.upvote('req-uuid-1', mockRequesterUser)).rejects.toThrow(
        ConflictException,
      );
      await expect(requestsService.upvote('req-uuid-1', mockRequesterUser)).rejects.toThrow(
        /You have already upvoted this maintenance request/,
      );
    });

    it('should throw NotFoundException when upvoting a non-existent request', async () => {
      await expect(requestsService.upvote('req-invalid-id', mockRequesterUser)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should reject upvotes from inactive/suspended accounts', async () => {
      await expect(requestsService.upvote('req-uuid-1', mockSuspendedUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should allow removing an existing upvote and log audit event', async () => {
      prismaService.requestVote.findUnique.mockResolvedValueOnce({
        id: 'vote-1',
        requestId: 'req-uuid-1',
        userId: mockRequesterUser.id,
      });

      const result = await requestsService.removeUpvote('req-uuid-1', mockRequesterUser);
      expect(result).toBeDefined();
      expect(prismaService.requestVote.delete).toHaveBeenCalledWith({
        where: {
          requestId_userId: {
            requestId: 'req-uuid-1',
            userId: mockRequesterUser.id,
          },
        },
      });
      expect(auditService.logAction).toHaveBeenCalledWith(
        mockRequesterUser.id,
        'REQUEST_UPVOTE_REMOVED',
        'MAINTENANCE_REQUEST',
        'req-uuid-1',
        expect.objectContaining({
          voterId: mockRequesterUser.id,
        }),
      );
    });
  });

  describe('Auditable Duplicate Request Linking (Phase 6O)', () => {
    const mockStaffUser: User = {
      ...mockRequesterUser,
      id: 'usr-manager-1',
      role: Role.FACILITY_MANAGER,
    };

    it('should mark a request as duplicate with audit logging and return updated record', async () => {
      const mockDup = { ...mockRequestRecord, id: 'req-dup-1', priority: Priority.MEDIUM };
      const mockOrig = { ...mockRequestRecord, id: 'req-orig-1' };
      prismaService.maintenanceRequest.findUnique = jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'req-dup-1') return Promise.resolve(mockDup);
        if (where.id === 'req-orig-1') return Promise.resolve(mockOrig);
        return Promise.resolve(null);
      });

      const result = await requestsService.markDuplicate(
        'req-dup-1',
        'req-orig-1',
        'Duplicate report of hallway leak',
        mockStaffUser,
      );

      expect(result).toBeDefined();
      expect(prismaService.requestDuplicate.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { duplicateRequestId: 'req-dup-1' },
          create: expect.objectContaining({
            originalRequestId: 'req-orig-1',
            duplicateRequestId: 'req-dup-1',
            markedById: mockStaffUser.id,
          }),
        }),
      );
      expect(auditService.logAction).toHaveBeenCalledWith(
        mockStaffUser.id,
        'REQUEST_MARKED_DUPLICATE',
        'MAINTENANCE_REQUEST',
        'req-dup-1',
        expect.objectContaining({
          originalRequestId: 'req-orig-1',
          markedBy: mockStaffUser.id,
        }),
      );
    });

    it('should prevent marking a request as a duplicate of itself', async () => {
      await expect(
        requestsService.markDuplicate('req-self', 'req-self', 'Invalid self link', mockStaffUser),
      ).rejects.toThrow(BadRequestException);
      await expect(
        requestsService.markDuplicate('req-self', 'req-self', 'Invalid self link', mockStaffUser),
      ).rejects.toThrow(/cannot be marked as a duplicate of itself/);
    });

    it('should prevent circular duplicate relationships', async () => {
      const mockReqA = { ...mockRequestRecord, id: 'req-A' };
      const mockReqB = { ...mockRequestRecord, id: 'req-B' };

      prismaService.maintenanceRequest.findUnique = jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'req-A') return Promise.resolve(mockReqA);
        if (where.id === 'req-B') return Promise.resolve(mockReqB);
        return Promise.resolve(null);
      });

      // B is already a duplicate of A
      prismaService.requestDuplicate.findUnique = jest.fn().mockImplementation(({ where }) => {
        if (where.duplicateRequestId === 'req-B') {
          return Promise.resolve({ originalRequestId: 'req-A', duplicateRequestId: 'req-B' });
        }
        return Promise.resolve(null);
      });

      // Trying to make A a duplicate of B should fail with circular error
      await expect(
        requestsService.markDuplicate('req-A', 'req-B', 'Loop attempt', mockStaffUser),
      ).rejects.toThrow(BadRequestException);
      await expect(
        requestsService.markDuplicate('req-A', 'req-B', 'Loop attempt', mockStaffUser),
      ).rejects.toThrow(/Circular duplicate relationship detected/);
    });

    it('should require minimum justification before marking a CRITICAL request as duplicate', async () => {
      const mockCritical = { ...mockRequestRecord, id: 'req-crit-1', priority: Priority.CRITICAL };
      const mockOrig = { ...mockRequestRecord, id: 'req-orig-1' };
      prismaService.maintenanceRequest.findUnique = jest.fn().mockImplementation(({ where }) => {
        if (where.id === 'req-crit-1') return Promise.resolve(mockCritical);
        if (where.id === 'req-orig-1') return Promise.resolve(mockOrig);
        return Promise.resolve(null);
      });

      await expect(
        requestsService.markDuplicate('req-crit-1', 'req-orig-1', 'short', mockStaffUser),
      ).rejects.toThrow(BadRequestException);
      await expect(
        requestsService.markDuplicate('req-crit-1', 'req-orig-1', 'short', mockStaffUser),
      ).rejects.toThrow(/Critical priority requests require an explicit justification/);
    });

    it('should unmark a duplicate request and record audit log', async () => {
      prismaService.requestDuplicate.findUnique = jest.fn().mockResolvedValue({
        id: 'dup-link-1',
        originalRequestId: 'req-orig-1',
        duplicateRequestId: 'req-dup-1',
      });

      prismaService.maintenanceRequest.findUnique = jest.fn().mockResolvedValue({
        ...mockRequestRecord,
        id: 'req-dup-1',
      });

      const result = await requestsService.unmarkDuplicate('req-dup-1', mockStaffUser);
      expect(result).toBeDefined();
      expect(prismaService.requestDuplicate.delete).toHaveBeenCalledWith({
        where: { duplicateRequestId: 'req-dup-1' },
      });
      expect(auditService.logAction).toHaveBeenCalledWith(
        mockStaffUser.id,
        'REQUEST_DUPLICATE_UNLINKED',
        'MAINTENANCE_REQUEST',
        'req-dup-1',
        expect.objectContaining({
          previousOriginalId: 'req-orig-1',
          unmarkedBy: mockStaffUser.id,
        }),
      );
    });
  });

  describe('Audit Logging & Metadata Redaction', () => {
    it('should sanitize sensitive data in audit metadata if passed', () => {
      const sensitiveMetadata = {
        requestNumber: 'REQ-2026-0001',
        userPassword: 'RawSecretPassword123!',
        jwtToken: 'Bearer eyJhbGciOi...',
        apiKey: 'secret-key-12345',
        authHeader: 'Basic dXNlcjpwYXNz',
        safeNotes: 'Standard public notes',
      };

      const sanitized = AuditService.sanitizeMetadata(sensitiveMetadata);

      expect(sanitized.requestNumber).toBe('REQ-2026-0001');
      expect(sanitized.userPassword).toBe('[REDACTED]');
      expect(sanitized.jwtToken).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.authHeader).toBe('[REDACTED]');
      expect(sanitized.safeNotes).toBe('Standard public notes');
    });
  });

  describe('Duplicate Suggestions, Priority Override & Reopening', () => {
    it('suggestDuplicates should return candidate matches based on title keywords and location', async () => {
      const candidates = await requestsService.suggestDuplicates('leaking water', mockLocation.id);
      expect(candidates).toHaveLength(1);
      expect(prismaService.maintenanceRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            locationId: mockLocation.id,
          }),
        }),
      );
    });

    it('suggestDuplicates should return empty array for short query string', async () => {
      const candidates = await requestsService.suggestDuplicates('ab');
      expect(candidates).toEqual([]);
    });

    it('overridePriority should update request priority and create audit log', async () => {
      prismaService.maintenanceRequest.update = jest.fn().mockResolvedValue({
        ...mockRequestRecord,
        priority: Priority.CRITICAL,
      });

      const result = await requestsService.overridePriority(
        'req-uuid-1',
        Priority.CRITICAL,
        'Executive event upcoming in hall',
        mockRequesterUser,
      );

      expect(prismaService.maintenanceRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'req-uuid-1' },
          data: expect.objectContaining({
            priority: Priority.CRITICAL,
            slaTargetHours: 2,
          }),
        }),
      );
      expect(auditService.logAction).toHaveBeenCalledWith(
        mockRequesterUser.id,
        'PRIORITY_OVERRIDDEN',
        'MAINTENANCE_REQUEST',
        'req-uuid-1',
        expect.objectContaining({
          newPriority: Priority.CRITICAL,
          reason: 'Executive event upcoming in hall',
        }),
      );
    });

    it('reopenRequest should transition request to REOPENED state and record audit log', async () => {
      prismaService.maintenanceRequest.update = jest.fn().mockResolvedValue({
        ...mockRequestRecord,
        status: RequestStatus.REOPENED,
      });

      const result = await requestsService.reopenRequest(
        'req-uuid-1',
        'Leak returned after storm',
        mockRequesterUser,
      );

      expect(prismaService.maintenanceRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'req-uuid-1' },
          data: expect.objectContaining({
            status: RequestStatus.REOPENED,
          }),
        }),
      );
      expect(auditService.logAction).toHaveBeenCalledWith(
        mockRequesterUser.id,
        'REQUEST_REOPENED',
        'MAINTENANCE_REQUEST',
        'req-uuid-1',
        expect.objectContaining({
          reason: 'Leak returned after storm',
        }),
      );
    });
  });
});
