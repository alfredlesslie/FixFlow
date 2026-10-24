import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;

  const mockNotification = {
    id: 'n-1',
    userId: 'usr-1',
    title: 'Work Order Assigned',
    message: 'You have been assigned to WO-2026-0001',
    type: 'ASSIGNMENT',
    isRead: false,
    link: '/technician',
    createdAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      notification: {
        findMany: jest.fn().mockResolvedValue([mockNotification]),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'n-1') return Promise.resolve(mockNotification);
          return Promise.resolve(null);
        }),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({ ...mockNotification, ...data }),
        ),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    service = new NotificationsService(prisma as PrismaService);
  });

  it('should find notifications scoped to user ID', async () => {
    const list = await service.findForUser('usr-1');
    expect(list).toHaveLength(1);
    expect(prisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'usr-1' },
      }),
    );
  });

  it('should mark an individual notification as read when owned by user', async () => {
    const result = await service.markAsRead('n-1', 'usr-1');
    expect(result.isRead).toBe(true);
    expect(prisma.notification.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'n-1' },
        data: { isRead: true },
      }),
    );
  });

  it('should throw ForbiddenException if user attempts to mark another user notification as read', async () => {
    await expect(service.markAsRead('n-1', 'usr-unauthorized')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should mark all notifications as read for a user', async () => {
    const ok = await service.markAllAsRead('usr-1');
    expect(ok).toBe(true);
    expect(prisma.notification.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'usr-1', isRead: false },
        data: { isRead: true },
      }),
    );
  });
});
