import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExpenseStatus, ReminderType, type ExpenseReminder } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationRemindersService } from '../src/notifications/notification-reminders.service';
import { PrismaService } from '../src/prisma/prisma.service';

const now = new Date('2026-07-18T10:00:00.000Z');
const expense = {
  id: '30000000-0000-4000-8000-000000000001',
  userId: 'user-1',
  expenseDate: new Date('2026-07-25T00:00:00.000Z'),
  expenseTime: null,
  status: ExpenseStatus.PLANNED,
  deletedAt: null,
  user: { timezone: 'Europe/Rome' },
};

function reminder(overrides: Partial<ExpenseReminder> = {}): ExpenseReminder {
  return {
    id: '50000000-0000-4000-8000-000000000001',
    userId: 'user-1',
    expenseId: expense.id,
    type: ReminderType.THREE_DAYS_BEFORE,
    offsetMinutes: 4_320,
    scheduledAt: new Date('2026-07-22T07:00:00.000Z'),
    isActive: true,
    processedAt: null,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('NotificationRemindersService', () => {
  let prisma: ReturnType<typeof prismaMock>;
  let service: NotificationRemindersService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    prisma = prismaMock();
    prisma.expense.findFirst.mockResolvedValue(expense);
    prisma.expenseReminder.findUnique.mockResolvedValue(null);
    prisma.expenseReminder.create.mockImplementation(({ data }) => Promise.resolve(reminder(data)));
    service = new NotificationRemindersService(
      prisma as unknown as PrismaService,
      { get: vi.fn((_key: string, fallback: string) => fallback) } as unknown as ConfigService,
    );
  });

  it('crea un preset con timestamp UTC e offset tipizzato', async () => {
    const result = await service.create('user-1', expense.id, { type: ReminderType.THREE_DAYS_BEFORE });
    expect(result.scheduledAt).toBe('2026-07-22T07:00:00.000Z');
    expect(prisma.expenseReminder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: 'user-1', expenseId: expense.id, offsetMinutes: 4_320 }),
    });
  });

  it('crea un custom valido con offset esplicito', async () => {
    const result = await service.create('user-1', expense.id, {
      type: ReminderType.CUSTOM,
      scheduledAt: '2026-07-20T09:00:00+02:00',
    });
    expect(result.type).toBe(ReminderType.CUSTOM);
    expect(prisma.expenseReminder.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ scheduledAt: new Date('2026-07-20T07:00:00.000Z'), offsetMinutes: null }),
    });
  });

  it.each([
    [{ type: ReminderType.CUSTOM }, 'custom senza data'],
    [{ type: ReminderType.CUSTOM, scheduledAt: '2026-07-26T07:00:00.000Z' }, 'dopo la spesa'],
    [{ type: ReminderType.CUSTOM, scheduledAt: '2026-07-18T08:00:00.000Z' }, 'nel passato'],
  ])('rifiuta %s (%s)', async (dto, description) => {
    expect(description).toBeTruthy();
    await expect(service.create('user-1', expense.id, dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rifiuta duplicati equivalenti anche prima dell’insert', async () => {
    prisma.expenseReminder.findUnique.mockResolvedValue(reminder());
    await expect(service.create('user-1', expense.id, { type: ReminderType.THREE_DAYS_BEFORE }))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it('non rivela spese altrui e rifiuta completate o annullate', async () => {
    prisma.expense.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...expense, status: ExpenseStatus.COMPLETED });
    await expect(service.create('other', expense.id, { type: ReminderType.SAME_DAY }))
      .rejects.toBeInstanceOf(NotFoundException);
    await expect(service.create('user-1', expense.id, { type: ReminderType.SAME_DAY }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('modifica e disattiva tramite soft cancellation', async () => {
    prisma.expenseReminder.findFirst.mockResolvedValue(reminder());
    prisma.expenseReminder.update.mockResolvedValue(reminder({ isActive: false, cancelledAt: now }));
    const result = await service.update('user-1', expense.id, reminder().id, { isActive: false });
    expect(result.isActive).toBe(false);
    expect(prisma.expenseReminder.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ isActive: false, cancelledAt: now }),
    }));
  });

  it('blocca il cambio data che renderebbe invalido un custom', async () => {
    prisma.expenseReminder.findFirst.mockResolvedValue({ id: reminder().id });
    await expect(service.validateExpenseMutation(
      'user-1', expense.id, new Date('2026-07-19T00:00:00.000Z'), null, ExpenseStatus.PLANNED,
    )).rejects.toBeInstanceOf(BadRequestException);
  });

  it('disattiva i promemoria futuri al cambio stato o soft delete', async () => {
    const transaction = prisma as unknown as Parameters<NotificationRemindersService['handleExpenseMutation']>[0];
    await service.handleExpenseMutation(transaction, expense.id, ExpenseStatus.COMPLETED, false);
    expect(prisma.expenseReminder.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { expenseId: expense.id, isActive: true, processedAt: null },
      data: expect.objectContaining({ isActive: false }),
    }));
  });
});

function prismaMock() {
  return {
    expense: { findFirst: vi.fn(), findUniqueOrThrow: vi.fn() },
    expenseReminder: {
      findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), create: vi.fn(),
      update: vi.fn(), updateMany: vi.fn(),
    },
  };
}
