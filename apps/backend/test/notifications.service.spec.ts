import { BadRequestException, NotFoundException } from '@nestjs/common';
import { NotificationStatus, NotificationType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationQueryDto } from '../src/notifications/dto/notification.dto';
import { NotificationsService } from '../src/notifications/notifications.service';
import { PrismaService } from '../src/prisma/prisma.service';

const row = {
  id: '60000000-0000-4000-8000-000000000001', userId: 'user-1', expenseId: null,
  reminderId: null, type: NotificationType.EXPENSE_REMINDER, status: NotificationStatus.UNREAD,
  title: 'Spesa in scadenza', message: 'Messaggio', scheduledAt: new Date('2026-07-18T07:00:00Z'),
  deduplicationKey: 'internal-key', readAt: null, archivedAt: null,
  createdAt: new Date('2026-07-18T07:00:00Z'), expense: null, reminder: null,
};

describe('NotificationsService', () => {
  let prisma: ReturnType<typeof prismaMock>;
  let service: NotificationsService;

  beforeEach(() => {
    prisma = prismaMock();
    service = new NotificationsService(prisma as unknown as PrismaService);
  });

  it('pagina e filtra escludendo archiviate per default', async () => {
    prisma.$transaction.mockResolvedValue([1, [row]]);
    const result = await service.findAll('user-1', Object.assign(new NotificationQueryDto(), {
      type: NotificationType.EXPENSE_REMINDER,
    }));
    expect(result.meta).toEqual({ page: 1, pageSize: 20, totalItems: 1, totalPages: 1 });
    expect(prisma.notification.count).toHaveBeenCalledWith({ where: expect.objectContaining({
      userId: 'user-1', status: { not: NotificationStatus.ARCHIVED }, type: NotificationType.EXPENSE_REMINDER,
    }) });
    expect(result.data[0]).not.toHaveProperty('deduplicationKey');
  });

  it('usa COUNT per il badge non letto', async () => {
    prisma.notification.count.mockResolvedValue(4);
    await expect(service.unreadCount('user-1')).resolves.toEqual({ count: 4 });
    expect(prisma.notification.count).toHaveBeenCalledWith({ where: { userId: 'user-1', status: NotificationStatus.UNREAD } });
  });

  it('applica ownership a dettaglio e mutazioni', async () => {
    prisma.notification.findFirst.mockResolvedValue(null);
    await expect(service.findOne('other', row.id)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.notification.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: row.id, userId: 'other' } }));
  });

  it('segna letta, non letta, tutte e archivia in modo idempotente', async () => {
    prisma.notification.findFirst.mockResolvedValue(row);
    prisma.notification.update.mockResolvedValue({ ...row, status: NotificationStatus.READ, readAt: new Date() });
    await expect(service.markRead('user-1', row.id)).resolves.toMatchObject({ status: NotificationStatus.READ });
    prisma.notification.findFirst.mockResolvedValue({ ...row, status: NotificationStatus.READ, readAt: new Date() });
    prisma.notification.update.mockResolvedValue({ ...row, status: NotificationStatus.UNREAD, readAt: null });
    await expect(service.markUnread('user-1', row.id)).resolves.toMatchObject({ status: NotificationStatus.UNREAD });
    prisma.notification.updateMany.mockResolvedValue({ count: 3 });
    await expect(service.markAllRead('user-1')).resolves.toEqual({ updatedCount: 3 });
    prisma.notification.findFirst.mockResolvedValue(row);
    prisma.notification.update.mockResolvedValue({ ...row, status: NotificationStatus.ARCHIVED, archivedAt: new Date() });
    await expect(service.archive('user-1', row.id)).resolves.toMatchObject({ status: NotificationStatus.ARCHIVED });
  });

  it('impedisce lettura di una notifica archiviata', async () => {
    prisma.notification.findFirst.mockResolvedValue({ ...row, status: NotificationStatus.ARCHIVED });
    await expect(service.markRead('user-1', row.id)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('disarchivia come READ, azzera archivedAt ed è idempotente', async () => {
    const archived = { ...row, status: NotificationStatus.ARCHIVED, archivedAt: new Date(), readAt: null };
    prisma.notification.findFirst.mockResolvedValue(archived);
    prisma.notification.update.mockResolvedValue({
      ...archived,
      status: NotificationStatus.READ,
      archivedAt: null,
      readAt: new Date(),
    });
    await expect(service.unarchive('user-1', row.id)).resolves.toMatchObject({
      status: NotificationStatus.READ,
      archivedAt: null,
    });
    expect(prisma.notification.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: row.id },
      data: expect.objectContaining({ status: NotificationStatus.READ, archivedAt: null }),
    }));

    prisma.notification.update.mockClear();
    prisma.notification.findFirst.mockResolvedValue({ ...row, status: NotificationStatus.READ, readAt: new Date() });
    await expect(service.unarchive('user-1', row.id)).resolves.toMatchObject({ status: NotificationStatus.READ });
    expect(prisma.notification.update).not.toHaveBeenCalled();
  });

  it('applica ricerca a titolo e messaggio mantenendo ownership', async () => {
    prisma.$transaction.mockResolvedValue([0, []]);
    await service.findAll('user-1', Object.assign(new NotificationQueryDto(), { search: 'affitto' }));
    expect(prisma.notification.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: 'user-1',
        OR: [
          { title: { contains: 'affitto' } },
          { message: { contains: 'affitto' } },
        ],
      }),
    });
  });
});

function prismaMock() {
  const notification = {
    count: vi.fn().mockResolvedValue(0), findMany: vi.fn(), findFirst: vi.fn(),
    update: vi.fn(), updateMany: vi.fn(),
  };
  return {
    notification,
    $transaction: vi.fn(),
  };
}
