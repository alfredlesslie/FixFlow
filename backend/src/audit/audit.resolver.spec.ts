import { AuditResolver } from './audit.resolver';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/enums';
import { ROLES_KEY } from '../common/decorators/roles.decorator';

describe('AuditResolver Security & Bounded Limits Suite', () => {
  let resolver: AuditResolver;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'audit-1',
            actorId: 'admin-1',
            action: 'USER_REGISTER_STAFF_APPLICATION',
            entity: 'REGISTRATION_APPLICATION',
            entityId: 'app-1',
            metadata: { email: 'tech@fixflow.edu' },
            timestamp: new Date(),
          },
        ]),
      },
    };

    resolver = new AuditResolver(mockPrisma as PrismaService);
  });

  it('restricts getAuditLogs query to Role.ADMIN metadata', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, AuditResolver.prototype.getAuditLogs);
    expect(roles).toEqual([Role.ADMIN]);
  });

  it('bounds limit to maximum 100 when client requests an excessive number', async () => {
    await resolver.getAuditLogs(undefined, 5000);

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
      where: undefined,
      take: 100,
      orderBy: { timestamp: 'desc' },
    });
  });

  it('bounds limit to minimum 1 when client passes non-positive number', async () => {
    await resolver.getAuditLogs('USER', -10);

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
      where: { entity: 'USER' },
      take: 1,
      orderBy: { timestamp: 'desc' },
    });
  });

  it('defaults limit to 50 when limit parameter is omitted or undefined', async () => {
    await resolver.getAuditLogs();

    expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith({
      where: undefined,
      take: 50,
      orderBy: { timestamp: 'desc' },
    });
  });

  it('serializes metadata to JSON string safely', async () => {
    const logs = await resolver.getAuditLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].metadata).toBe(JSON.stringify({ email: 'tech@fixflow.edu' }));
  });
});
