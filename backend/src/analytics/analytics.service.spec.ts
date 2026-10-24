import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      maintenanceRequest: {
        count: jest.fn().mockImplementation((args) => {
          const where = args?.where;
          if (!where) return Promise.resolve(20);
          if (where.slaBreached) return Promise.resolve(2);
          if (where.status?.notIn) return Promise.resolve(12);
          if (where.priority?.in) return Promise.resolve(8);
          if (where.status === 'RESOLVED') return Promise.resolve(3);
          return Promise.resolve(5);
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            createdAt: new Date('2026-10-17T08:00:00Z'),
            resolvedAt: new Date('2026-10-17T12:00:00Z'),
          },
        ]),
      },
      workOrder: {
        count: jest.fn().mockResolvedValue(6),
      },
    };

    service = new AnalyticsService(prisma as PrismaService);
  });

  it('should calculate live metrics correctly', async () => {
    const summary = await service.getSummary();

    expect(summary.totalRequests).toBe(20);
    expect(summary.unresolvedRequests).toBe(12);
    expect(summary.criticalOrHigh).toBe(8);
    expect(summary.activeWorkOrders).toBe(6);
    expect(summary.pendingVerification).toBe(3);
    expect(summary.slaComplianceRate).toBe(90.0);
    expect(summary.mttrHours).toBe(4.0);
  });
});
