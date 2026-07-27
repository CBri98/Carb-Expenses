import { ConfigService } from '@nestjs/config';
import {
  ExpenseStatus,
  NotificationType,
  ReminderType,
} from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationSchedulerService } from '../src/notifications/notification-scheduler.service';
import { PrismaService } from '../src/prisma/prisma.service';

const now = new Date('2026-07-18T10:00:00.000Z');
const expense = {
  id: '30000000-0000-4000-8000-000000000001', userId: 'user-1',
  description: 'Assicurazione auto', expenseDate: new Date('2026-07-18T00:00:00.000Z'),
  expenseTime: null, status: ExpenseStatus.PLANNED, deletedAt: null,
  overdueNotifiedForDate: null, user: { timezone: 'Europe/Rome' },
};
const dueReminder = {
  id: '50000000-0000-4000-8000-000000000001', userId: 'user-1', expenseId: expense.id,
  type: ReminderType.THREE_DAYS_BEFORE, scheduledAt: new Date('2026-07-18T09:00:00.000Z'),
  isActive: true, processedAt: null, expense,
};

describe('NotificationSchedulerService', () => {
  let prisma: ReturnType<typeof prismaMock>;
  let service: NotificationSchedulerService;

  beforeEach(() => {
    prisma = prismaMock();
    service = new NotificationSchedulerService(
      prisma as unknown as PrismaService,
      { get: vi.fn((_key: string, fallback: string) => fallback) } as unknown as ConfigService,
    );
  });

  it('interroga soltanto promemoria attivi, non processati e dovuti', async () => {
    prisma.expenseReminder.findMany.mockResolvedValue([]);
    prisma.expense.findMany.mockResolvedValue([]);
    await service.runCycle(now);
    expect(prisma.expenseReminder.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        isActive: true,
        processedAt: null,
        scheduledAt: { lte: now },
        expense: { status: ExpenseStatus.PLANNED, deletedAt: null },
      },
      take: 100,
    }));
  });

  it('processa atomicamente un reminder dovuto e crea la deduplication key', async () => {
    prisma.expenseReminder.findMany.mockResolvedValue([dueReminder]);
    prisma.expense.findMany.mockResolvedValue([]);
    prisma.expense.findFirst.mockResolvedValue(expense);
    prisma.expenseReminder.updateMany.mockResolvedValue({ count: 1 });
    prisma.notification.upsert.mockResolvedValue({ createdAt: now });

    const result = await service.runCycle(now);
    expect(result.processedReminders).toBe(1);
    expect(result.generatedNotifications).toBe(1);
    expect(prisma.notification.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { deduplicationKey: `expense-reminder:${dueReminder.id}:${dueReminder.scheduledAt.toISOString()}` },
      create: expect.objectContaining({ type: NotificationType.EXPENSE_REMINDER }),
    }));
  });

  it('più run consecutivi non riprocessano un reminder già acquisito', async () => {
    prisma.expenseReminder.findMany.mockResolvedValueOnce([dueReminder]).mockResolvedValue([]);
    prisma.expense.findMany.mockResolvedValue([]);
    prisma.expense.findFirst.mockResolvedValue(expense);
    prisma.expenseReminder.updateMany.mockResolvedValue({ count: 1 });
    prisma.notification.upsert.mockResolvedValue({ createdAt: now });
    await service.runCycle(now);
    await service.runCycle(now);
    expect(prisma.notification.upsert).toHaveBeenCalledTimes(1);
  });

  it('un errore su un elemento non blocca i reminder successivi', async () => {
    prisma.expenseReminder.findMany.mockResolvedValue([
      dueReminder,
      { ...dueReminder, id: '50000000-0000-4000-8000-000000000002' },
    ]);
    prisma.expense.findMany.mockResolvedValue([]);
    prisma.$transaction
      .mockRejectedValueOnce(new Error('errore isolato'))
      .mockImplementation(async (callback) => callback(prisma));
    prisma.expense.findFirst.mockResolvedValue(expense);
    prisma.expenseReminder.updateMany.mockResolvedValue({ count: 1 });
    prisma.notification.upsert.mockResolvedValue({ createdAt: now });
    const result = await service.runCycle(now);
    expect(result.errors).toBe(1);
    expect(result.processedReminders).toBe(1);
  });

  it('crea una sola overdue e marca la data senza cambiare lo stato', async () => {
    const overdue = {
      ...expense,
      expenseDate: new Date('2026-07-17T00:00:00.000Z'),
    };
    prisma.expenseReminder.findMany.mockResolvedValue([]);
    prisma.expense.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([overdue]);
    prisma.expense.updateMany.mockResolvedValue({ count: 1 });
    prisma.notification.upsert.mockResolvedValue({});
    const result = await service.runCycle(now);
    expect(result.generatedOverdue).toBe(1);
    expect(prisma.expense.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: { overdueNotifiedForDate: overdue.expenseDate },
      where: expect.objectContaining({ status: ExpenseStatus.PLANNED }),
    }));
    expect(prisma.notification.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ type: NotificationType.EXPENSE_OVERDUE }),
    }));
  });

  it('rispetta le preferenze utente per gli avvisi automatici', async () => {
    prisma.expenseReminder.findMany.mockResolvedValue([]);
    prisma.expense.findMany
      .mockResolvedValueOnce([{ ...expense, user: { timezone: 'Europe/Rome', preference: { dueTodayEnabled: false, defaultReminderTime: new Date('1970-01-01T08:30:00.000Z') } } }])
      .mockResolvedValueOnce([]);
    const result = await service.runCycle(now);
    expect(result.generatedDueToday).toBe(0);
    expect(prisma.notification.create).not.toHaveBeenCalled();
  });
});

function prismaMock() {
  const mock = {
    expenseReminder: { findMany: vi.fn(), updateMany: vi.fn() },
    expense: { findMany: vi.fn(), findFirst: vi.fn(), updateMany: vi.fn() },
    notification: { upsert: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  };
  mock.$transaction.mockImplementation(async (callback) => callback(mock));
  return mock;
}
