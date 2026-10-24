import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { WorkOrdersService } from './work-orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { WorkOrderStatus, RequestStatus, Role, AccountStatus } from '../common/enums';
import { User } from '../users/models/user.model';

describe('WorkOrdersService', () => {
  let service: WorkOrdersService;
  let prisma: any;
  let audit: Partial<AuditService>;

  const mockManager: User = {
    id: 'usr-mgr-1',
    email: 'manager@fixflow.edu',
    firstName: 'Robert',
    lastName: 'Sterling',
    name: 'Robert Sterling',
    role: Role.FACILITY_MANAGER,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    tokenVersion: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTech1: User = {
    id: 'usr-tech-1',
    email: 'tech1@fixflow.edu',
    firstName: 'Marcus',
    lastName: 'Vance',
    name: 'Marcus Vance',
    role: Role.TECHNICIAN,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    tokenVersion: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTech2: User = {
    id: 'usr-tech-2',
    email: 'tech2@fixflow.edu',
    firstName: 'Elena',
    lastName: 'Rostova',
    name: 'Elena Rostova',
    role: Role.TECHNICIAN,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    tokenVersion: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest = {
    id: 'req-1',
    requestNumber: 'REQ-2026-0001',
    title: 'Water pipe leak',
    assetId: 'ast-pipe-1',
    status: RequestStatus.OPEN,
    requesterId: 'usr-req-1',
    workOrder: null,
  };

  const mockWorkOrder = {
    id: 'wo-1',
    orderNumber: 'WO-2026-0001',
    requestId: 'req-1',
    assetId: 'ast-pipe-1',
    technicianId: mockTech1.id,
    status: WorkOrderStatus.PENDING,
    instructions: 'Isolate supply valve and inspect joint',
    estimatedCost: 150.0,
    startedAt: null,
    completedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    request: mockRequest,
    technician: mockTech1,
    handovers: [],
    records: [],
  };

  beforeEach(() => {
    prisma = {
      workOrder: {
        findMany: jest.fn().mockResolvedValue([mockWorkOrder]),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'wo-1') return Promise.resolve(mockWorkOrder);
          return Promise.resolve(null);
        }),
        create: jest.fn().mockResolvedValue(mockWorkOrder),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ ...mockWorkOrder, ...data }),
        ),
        count: jest.fn().mockResolvedValue(1),
      },
      maintenanceRequest: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'req-1') return Promise.resolve(mockRequest);
          return Promise.resolve(null);
        }),
        update: jest.fn().mockResolvedValue(mockRequest),
      },
      user: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === mockTech1.id) return Promise.resolve(mockTech1);
          if (where.id === mockTech2.id) return Promise.resolve(mockTech2);
          return Promise.resolve(null);
        }),
      },
      workOrderHandover: {
        create: jest.fn().mockResolvedValue({ id: 'ho-1' }),
      },
      maintenanceRecord: {
        create: jest.fn().mockResolvedValue({ id: 'rec-1' }),
      },
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'aud-1' }),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(prisma);
      }),
    };

    audit = {
      logAction: jest.fn().mockResolvedValue({ id: 'aud-1' } as any),
    };

    service = new WorkOrdersService(prisma as PrismaService, audit as AuditService);
  });

  describe('Work Order Creation & Dispatch', () => {
    it('should create a work order and link it to request with ASSIGNED status', async () => {
      const input = {
        requestId: 'req-1',
        technicianId: mockTech1.id,
        instructions: 'Fix pipe leak',
        estimatedCost: 120,
      };

      const result = await service.create(input, mockManager);

      expect(result).toBeDefined();
      expect(prisma.workOrder.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requestId: 'req-1',
            technicianId: mockTech1.id,
            status: WorkOrderStatus.PENDING,
          }),
        }),
      );
      expect(prisma.maintenanceRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'req-1' },
          data: { status: RequestStatus.ASSIGNED },
        }),
      );
    });

    it('should reject creation if request is already linked to another work order', async () => {
      prisma.maintenanceRequest.findUnique.mockResolvedValueOnce({
        ...mockRequest,
        workOrder: { id: 'wo-existing', orderNumber: 'WO-2026-0099' },
      });

      await expect(
        service.create(
          { requestId: 'req-1', technicianId: mockTech1.id },
          mockManager,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('should reject non-technician user assignment', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        ...mockTech1,
        role: Role.REQUESTER,
      });

      await expect(
        service.create(
          { requestId: 'req-1', technicianId: mockTech1.id },
          mockManager,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Technician Acceptance & Progress Updates', () => {
    it('technician should accept work order assigned to them', async () => {
      const result = await service.accept('wo-1', mockTech1);

      expect(prisma.workOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wo-1' },
          data: { status: WorkOrderStatus.ACCEPTED },
        }),
      );
    });

    it('other technicians should be forbidden from accepting someone else work order', async () => {
      await expect(service.accept('wo-1', mockTech2)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('status update to IN_PROGRESS should record startedAt and update request status', async () => {
      await service.updateStatus(
        { id: 'wo-1', status: WorkOrderStatus.IN_PROGRESS, workNotes: 'Started inspection' },
        mockTech1,
      );

      expect(prisma.workOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: WorkOrderStatus.IN_PROGRESS,
            startedAt: expect.any(Date),
            workNotes: 'Started inspection',
          }),
        }),
      );
      expect(prisma.maintenanceRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'req-1' },
          data: { status: RequestStatus.IN_PROGRESS },
        }),
      );
    });
  });

  describe('Completion, Verification & Maintenance Record Creation', () => {
    it('completing work order should record maintenance record and transition request to RESOLVED', async () => {
      await service.complete(
        {
          id: 'wo-1',
          resolutionSummary: 'Replaced compression gasket seal',
          partsUsed: '1x 2-inch EPDM gasket',
          actualCost: 45.0,
        },
        mockTech1,
      );

      expect(prisma.workOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: WorkOrderStatus.COMPLETED,
            resolutionSummary: 'Replaced compression gasket seal',
            actualCost: 45.0,
          }),
        }),
      );

      expect(prisma.maintenanceRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            assetId: 'ast-pipe-1',
            actionTaken: 'Replaced compression gasket seal',
            cost: 45.0,
          }),
        }),
      );

      expect(prisma.maintenanceRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'req-1' },
          data: expect.objectContaining({
            status: RequestStatus.RESOLVED,
          }),
        }),
      );
    });

    it('manager approval should close request with verification notes', async () => {
      prisma.workOrder.findUnique.mockResolvedValueOnce({
        ...mockWorkOrder,
        status: WorkOrderStatus.COMPLETED,
      });

      await service.verify(
        { id: 'wo-1', approved: true, notes: 'Pressure tested at 60 psi - no leaks.' },
        mockManager,
      );

      expect(prisma.maintenanceRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'req-1' },
          data: expect.objectContaining({
            status: RequestStatus.CLOSED,
            verificationNotes: 'Pressure tested at 60 psi - no leaks.',
          }),
        }),
      );
    });

    it('manager rejection should send request back to IN_PROGRESS for rework', async () => {
      prisma.workOrder.findUnique.mockResolvedValueOnce({
        ...mockWorkOrder,
        status: WorkOrderStatus.COMPLETED,
      });

      await service.verify(
        { id: 'wo-1', approved: false, notes: 'Slight seepage still noticeable at joint' },
        mockManager,
      );

      expect(prisma.maintenanceRequest.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'req-1' },
          data: expect.objectContaining({
            status: RequestStatus.IN_PROGRESS,
          }),
        }),
      );
      expect(prisma.workOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wo-1' },
          data: expect.objectContaining({
            status: WorkOrderStatus.IN_PROGRESS,
          }),
        }),
      );
    });
  });

  describe('Shift Handover Protocol', () => {
    it('should transfer technician assignment and log handover record', async () => {
      prisma.workOrder.findUnique.mockResolvedValueOnce({
        ...mockWorkOrder,
        status: WorkOrderStatus.IN_PROGRESS,
      });

      await service.handover(
        {
          workOrderId: 'wo-1',
          nextTechId: mockTech2.id,
          handoverNotes: 'Refrigerant pressure at 110 psi; needs 30 min vacuum test',
          reason: 'End of daytime shift',
        },
        mockTech1,
      );

      expect(prisma.workOrderHandover.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workOrderId: 'wo-1',
            previousTechId: mockTech1.id,
            nextTechId: mockTech2.id,
            handoverNotes: 'Refrigerant pressure at 110 psi; needs 30 min vacuum test',
            reason: 'End of daytime shift',
          }),
        }),
      );

      expect(prisma.workOrder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wo-1' },
          data: expect.objectContaining({
            technicianId: mockTech2.id,
          }),
        }),
      );
    });
  });
});
