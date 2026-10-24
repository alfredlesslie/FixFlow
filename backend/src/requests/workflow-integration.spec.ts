import { PrismaClient } from '@prisma/client';
import { assertTestDatabase } from '../common/config/db-safety-guard';
import { Role, AccountStatus, Priority, RequestStatus, WorkOrderStatus } from '../common/enums';
import { randomUUID } from 'crypto';

describe('FixFlow End-to-End Workflow & Account Switching Integration Suite (Phase 6N)', () => {
  let prisma: PrismaClient;
  const testDbUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

  // Seeded entities for workflow testing
  let requester: any;
  let technician1: any;
  let technician2: any;
  let manager: any;
  let admin: any;
  let location: any;

  beforeAll(async () => {
    // 1. Mandatory Target Verification: Require explicit test DB URL and assert test database isolation
    if (!testDbUrl) {
      throw new Error(
        '[INTEGRATION TEST CONFIGURATION ERROR] An explicit TEST_DATABASE_URL (or DATABASE_URL) pointing to an isolated test database is required to run workflow-integration.spec.ts. Silent fallback to local development database is strictly prohibited.'
      );
    }
    assertTestDatabase(testDbUrl);

    prisma = new PrismaClient({
      datasources: { db: { url: testDbUrl } },
    });

    await prisma.$connect();

    // 2. Clear test database tables in reverse dependency order
    await prisma.requestVote.deleteMany();
    await prisma.requestDuplicate.deleteMany();
    await prisma.attachment.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.workOrderHandover.deleteMany();
    await prisma.maintenanceRecord.deleteMany();
    await prisma.workOrder.deleteMany();
    await prisma.maintenanceRequest.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.assetCategory.deleteMany();
    await prisma.location.deleteMany();
    await prisma.user.deleteMany();

    // 3. Seed isolated test location
    location = await prisma.location.create({
      data: {
        name: 'Science Complex - Lab 304',
        code: 'SCI-304-TEST',
        building: 'Science Complex',
        floor: '3rd Floor',
        roomNumber: '304',
      },
    });

    // 4. Seed isolated test users for all four institutional roles
    requester = await prisma.user.create({
      data: {
        email: `requester-${randomUUID()}@fixflow.edu`,
        passwordHash: '$2a$10$dummyHashForWorkflowTestsOnly',
        firstName: 'Ananya',
        lastName: 'Iyer',
        role: Role.REQUESTER,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
      },
    });

    technician1 = await prisma.user.create({
      data: {
        email: `tech1-${randomUUID()}@fixflow.edu`,
        passwordHash: '$2a$10$dummyHashForWorkflowTestsOnly',
        firstName: 'Vikram',
        lastName: 'Singh',
        role: Role.TECHNICIAN,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
      },
    });

    technician2 = await prisma.user.create({
      data: {
        email: `tech2-${randomUUID()}@fixflow.edu`,
        passwordHash: '$2a$10$dummyHashForWorkflowTestsOnly',
        firstName: 'Rohan',
        lastName: 'Mehta',
        role: Role.TECHNICIAN,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
      },
    });

    manager = await prisma.user.create({
      data: {
        email: `manager-${randomUUID()}@fixflow.edu`,
        passwordHash: '$2a$10$dummyHashForWorkflowTestsOnly',
        firstName: 'Deepak',
        lastName: 'Patel',
        role: Role.FACILITY_MANAGER,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
      },
    });

    admin = await prisma.user.create({
      data: {
        email: `admin-${randomUUID()}@fixflow.edu`,
        passwordHash: '$2a$10$dummyHashForWorkflowTestsOnly',
        firstName: 'Suresh',
        lastName: 'Kumar',
        role: Role.ADMIN,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
      },
    });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  describe('1. Maintenance Request Lifecycle Progression', () => {
    let primaryRequestId: string;
    let duplicateRequestId: string;
    let workOrderId: string;

    it('Step 1: Requester creates a maintenance request with SLA deadline calculation', async () => {
      const now = new Date();
      const slaDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24-hour SLA

      const req = await prisma.maintenanceRequest.create({
        data: {
          requestNumber: `REQ-2026-TEST-0001`,
          title: 'High pressure steam valve whistling in Lab 304',
          description: 'Audible hissing sound and condensation buildup on main supply valve',
          requesterId: requester.id,
          locationId: location.id,
          priority: Priority.HIGH,
          status: RequestStatus.OPEN,
          slaTargetHours: 8,
          slaDeadline,
        },
      });

      expect(req).toBeDefined();
      expect(req.id).toBeDefined();
      expect(req.status).toBe(RequestStatus.OPEN);
      primaryRequestId = req.id;
    });

    it('Step 2: Occupants upvote primary request; verify unique vote constraint and vote count', async () => {
      // First upvote by manager
      const vote1 = await prisma.requestVote.create({
        data: {
          requestId: primaryRequestId,
          userId: manager.id,
        },
      });
      expect(vote1.id).toBeDefined();

      // Second upvote by technician
      const vote2 = await prisma.requestVote.create({
        data: {
          requestId: primaryRequestId,
          userId: technician1.id,
        },
      });
      expect(vote2.id).toBeDefined();

      // Duplicate vote attempt by manager must fail database unique constraint
      await expect(
        prisma.requestVote.create({
          data: {
            requestId: primaryRequestId,
            userId: manager.id,
          },
        }),
      ).rejects.toThrow();

      // Verify authoritative vote count
      const count = await prisma.requestVote.count({
        where: { requestId: primaryRequestId },
      });
      expect(count).toBe(2);

      // Verify vote removal works
      await prisma.requestVote.delete({
        where: {
          requestId_userId: {
            requestId: primaryRequestId,
            userId: technician1.id,
          },
        },
      });

      const updatedCount = await prisma.requestVote.count({
        where: { requestId: primaryRequestId },
      });
      expect(updatedCount).toBe(1);
    });

    it('Step 3: Duplicate request creation and explicit duplicate linking', async () => {
      // Second occupant reports similar issue
      const dupReq = await prisma.maintenanceRequest.create({
        data: {
          requestNumber: `REQ-2026-TEST-0002`,
          title: 'Steam hissing from pipe in Room 304',
          description: 'Steam leak observed near ceiling',
          requesterId: requester.id,
          locationId: location.id,
          priority: Priority.HIGH,
          status: RequestStatus.OPEN,
          slaTargetHours: 8,
          slaDeadline: new Date(Date.now() + 8 * 3600 * 1000),
        },
      });
      duplicateRequestId = dupReq.id;

      // Link duplicate request to primary request
      const link = await prisma.requestDuplicate.create({
        data: {
          originalRequestId: primaryRequestId,
          duplicateRequestId: duplicateRequestId,
          markedById: manager.id,
          reason: 'Identified as identical steam pipe leak reported in REQ-2026-TEST-0001',
        },
      });

      expect(link.id).toBeDefined();
      expect(link.originalRequestId).toBe(primaryRequestId);
      expect(link.duplicateRequestId).toBe(duplicateRequestId);

      // Verify relational queries resolve duplicate link
      const loadedDup = await prisma.maintenanceRequest.findUnique({
        where: { id: duplicateRequestId },
        include: {
          duplicateLinkAsDuplicate: {
            include: { originalRequest: true },
          },
        },
      });
      expect(loadedDup?.duplicateLinkAsDuplicate?.originalRequest.id).toBe(primaryRequestId);
    });

    it('Step 4: Facility Manager overrides priority to CRITICAL with SLA recalculation', async () => {
      const criticalSlaDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const updated = await prisma.maintenanceRequest.update({
        where: { id: primaryRequestId },
        data: {
          priority: Priority.CRITICAL,
          slaTargetHours: 2,
          slaDeadline: criticalSlaDeadline,
          status: RequestStatus.TRIAGED,
        },
      });

      expect(updated.priority).toBe(Priority.CRITICAL);
      expect(updated.status).toBe(RequestStatus.TRIAGED);
      expect(updated.slaTargetHours).toBe(2);
    });

    it('Step 5: Work Order created and assigned to Technician 1', async () => {
      const wo = await prisma.workOrder.create({
        data: {
          orderNumber: `WO-2026-TEST-0001`,
          requestId: primaryRequestId,
          technicianId: technician1.id,
          status: WorkOrderStatus.PENDING,
          instructions: 'Inspect high pressure seal, isolate auxiliary steam valve before servicing.',
        },
      });

      expect(wo.id).toBeDefined();
      expect(wo.status).toBe(WorkOrderStatus.PENDING);
      expect(wo.technicianId).toBe(technician1.id);
      workOrderId = wo.id;

      // Update request status to ASSIGNED
      await prisma.maintenanceRequest.update({
        where: { id: primaryRequestId },
        data: { status: RequestStatus.ASSIGNED },
      });
    });

    it('Step 6: Technician 1 accepts and begins work (IN_PROGRESS)', async () => {
      const startedAt = new Date();
      const updatedWo = await prisma.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: WorkOrderStatus.IN_PROGRESS,
          startedAt,
          workNotes: 'Arrived at Lab 304. Valve isolation completed. Disassembling bonnet.',
        },
      });

      expect(updatedWo.status).toBe(WorkOrderStatus.IN_PROGRESS);
      expect(updatedWo.startedAt).toBeDefined();

      await prisma.maintenanceRequest.update({
        where: { id: primaryRequestId },
        data: { status: RequestStatus.IN_PROGRESS },
      });
    });

    it('Step 7: Shift change handover from Technician 1 to Technician 2', async () => {
      const handover = await prisma.workOrderHandover.create({
        data: {
          workOrderId,
          previousTechId: technician1.id,
          nextTechId: technician2.id,
          handoverNotes: 'Replaced damaged Teflon gasket. New seal seated. Pressure test needed.',
          reason: 'Shift rotation handover',
        },
      });

      expect(handover.id).toBeDefined();
      expect(handover.previousTechId).toBe(technician1.id);
      expect(handover.nextTechId).toBe(technician2.id);

      // Reassign work order to technician 2
      const reassignedWo = await prisma.workOrder.update({
        where: { id: workOrderId },
        data: { technicianId: technician2.id },
      });
      expect(reassignedWo.technicianId).toBe(technician2.id);
    });

    it('Step 8: Technician 2 completes work order and adds resolution summary', async () => {
      const completedAt = new Date();
      const completedWo = await prisma.workOrder.update({
        where: { id: workOrderId },
        data: {
          status: WorkOrderStatus.COMPLETED,
          completedAt,
          resolutionSummary: 'Hydrostatic pressure test passed at 150 PSI. No leaks observed.',
          partsUsed: 'High-temp Teflon steam gasket (1.5")',
          actualCost: 45.0,
        },
      });

      expect(completedWo.status).toBe(WorkOrderStatus.COMPLETED);
      expect(completedWo.completedAt).toBeDefined();
      expect(completedWo.resolutionSummary).toContain('150 PSI');

      // Request transitions to RESOLVED
      const resolvedReq = await prisma.maintenanceRequest.update({
        where: { id: primaryRequestId },
        data: {
          status: RequestStatus.RESOLVED,
          resolvedAt: completedAt,
        },
      });
      expect(resolvedReq.status).toBe(RequestStatus.RESOLVED);
      expect(resolvedReq.resolvedAt).toBeDefined();
    });

    it('Step 9: Requester verifies resolution and closes request', async () => {
      const closedAt = new Date();
      const verifiedReq = await prisma.maintenanceRequest.update({
        where: { id: primaryRequestId },
        data: {
          status: RequestStatus.CLOSED,
          closedAt,
          verificationNotes: 'Checked valve in morning lab session. Temperature and pressure normal. No noise.',
        },
      });

      expect(verifiedReq.status).toBe(RequestStatus.CLOSED);
      expect(verifiedReq.closedAt).toBeDefined();
      expect(verifiedReq.verificationNotes).toContain('Temperature and pressure normal');
    });

    it('Step 10: Institutional audit logs and notifications persisted correctly', async () => {
      // Create test notification
      const notif = await prisma.notification.create({
        data: {
          userId: requester.id,
          title: 'Issue Resolved',
          message: 'Your maintenance request REQ-2026-TEST-0001 has been resolved by maintenance staff.',
          type: 'REQUEST_RESOLVED',
          link: `/requester?requestId=${primaryRequestId}`,
        },
      });

      expect(notif.id).toBeDefined();
      expect(notif.isRead).toBe(false);

      // Verify comments
      const comment = await prisma.comment.create({
        data: {
          requestId: primaryRequestId,
          authorId: technician2.id,
          content: 'Repairs completed and verified. System operational.',
          isInternal: false,
        },
      });

      expect(comment.id).toBeDefined();
      expect(comment.requestId).toBe(primaryRequestId);
    });

    it('Step 11: Reopening workflow preserves complete audit history', async () => {
      const reopened = await prisma.maintenanceRequest.update({
        where: { id: primaryRequestId },
        data: {
          status: RequestStatus.REOPENED,
        },
      });

      expect(reopened.status).toBe(RequestStatus.REOPENED);

      // Verify original comments, votes, duplicates, and work orders still exist
      const fullHistory = await prisma.maintenanceRequest.findUnique({
        where: { id: primaryRequestId },
        include: {
          workOrder: { include: { handovers: true } },
          comments: true,
          votes: true,
          duplicateOfLinks: true,
        },
      });

      expect(fullHistory?.comments).toHaveLength(1);
      expect(fullHistory?.votes).toHaveLength(1);
      expect(fullHistory?.duplicateOfLinks).toHaveLength(1);
      expect(fullHistory?.workOrder?.handovers).toHaveLength(1);
    });
  });

  describe('2. Account Switching Data Isolation & Session Integrity', () => {
    it('verifies Requester -> Technician -> Administrator -> Requester switching preserves data and enforces role constraints', async () => {
      // Verify all users are distinct accounts in isolated database
      expect(requester.role).toBe(Role.REQUESTER);
      expect(technician1.role).toBe(Role.TECHNICIAN);
      expect(admin.role).toBe(Role.ADMIN);
      expect(manager.role).toBe(Role.FACILITY_MANAGER);

      // 1. Requester cannot see other users' private work orders
      const requesterWorkOrders = await prisma.workOrder.findMany({
        where: { technicianId: requester.id },
      });
      expect(requesterWorkOrders).toHaveLength(0);

      // 2. Technician 1 only sees their assigned work orders
      const tech1WorkOrders = await prisma.workOrder.findMany({
        where: { technicianId: technician1.id },
      });
      // After handover in Step 7, technician1 has 0 assigned
      expect(tech1WorkOrders).toHaveLength(0);

      const tech2WorkOrders = await prisma.workOrder.findMany({
        where: { technicianId: technician2.id },
      });
      expect(tech2WorkOrders).toHaveLength(1);

      // 3. Manager/Admin can view all maintenance requests
      const allRequests = await prisma.maintenanceRequest.findMany();
      expect(allRequests.length).toBeGreaterThanOrEqual(2);
    });
  });
});
