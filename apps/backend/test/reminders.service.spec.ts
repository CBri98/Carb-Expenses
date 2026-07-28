import { ConflictException, NotFoundException } from '@nestjs/common';
import {
  ExpenseStatus,
  PaymentMethod,
  Prisma,
  ReminderSource,
  ReminderType,
} from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotificationRemindersService } from '../src/notifications/notification-reminders.service';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  ReminderDerivedStatus,
  ReminderQueryDto,
} from '../src/reminders/dto/reminder.dto';
import { RemindersService } from '../src/reminders/reminders.service';
import type { ReminderWithRelations } from '../src/reminders/reminders.types';

const now = new Date('2026-07-28T10:00:00.000Z');
const reminderId = '50000000-0000-4000-8000-000000000001';

describe('RemindersService', () => {
  let prisma: ReturnType<typeof prismaMock>;
  let contextual: { update: ReturnType<typeof vi.fn> };
  let service: RemindersService;

  beforeEach(() => {
    prisma = prismaMock();
    contextual = { update: vi.fn().mockResolvedValue({}) };
    service = new RemindersService(
      prisma as unknown as PrismaService,
      contextual as unknown as NotificationRemindersService,
    );
  });

  it('pagina e ordina server-side applicando ownership, ricerca e filtri relazionali', async () => {
    prisma.expenseReminder.count.mockResolvedValue(1);
    prisma.expenseReminder.findMany.mockResolvedValue([reminder()]);
    const query = Object.assign(new ReminderQueryDto(), {
      page: 2,
      pageSize: 10,
      search: 'auto',
      status: ReminderDerivedStatus.UPCOMING,
      type: ReminderType.THREE_DAYS_BEFORE,
      source: ReminderSource.MANUAL,
      categoryId: '10000000-0000-4000-8000-000000000001',
      recurrenceRuleId: '70000000-0000-4000-8000-000000000001',
      scheduledFrom: '2026-07-28T00:00:00.000Z',
      scheduledTo: '2026-08-04T23:59:59.000Z',
      expenseDateFrom: '2026-08-01',
      expenseDateTo: '2026-08-31',
    });

    const result = await service.findAll('user-1', query, now);

    expect(result.meta).toEqual({ page: 2, pageSize: 10, totalItems: 1, totalPages: 1 });
    expect(result.data[0]?.source).toBe(ReminderSource.MANUAL);
    expect(prisma.expenseReminder.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        userId: 'user-1',
        type: ReminderType.THREE_DAYS_BEFORE,
        source: ReminderSource.MANUAL,
        scheduledAt: {
          gte: new Date('2026-07-28T00:00:00.000Z'),
          lte: new Date('2026-08-04T23:59:59.000Z'),
        },
        expense: { is: expect.objectContaining({
          categoryId: '10000000-0000-4000-8000-000000000001',
          recurrenceRuleId: '70000000-0000-4000-8000-000000000001',
          expenseDate: {
            gte: new Date('2026-08-01T00:00:00.000Z'),
            lte: new Date('2026-08-31T00:00:00.000Z'),
          },
        }) },
        AND: expect.arrayContaining([
          expect.objectContaining({ isActive: true, processedAt: null }),
          expect.objectContaining({ OR: expect.any(Array) }),
        ]),
      }),
      skip: 10,
      take: 10,
    }));
  });

  it('calcola il riepilogo con query aggregate e prossimo promemoria owned', async () => {
    prisma.expenseReminder.count
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(22)
      .mockResolvedValueOnce(3);
    prisma.expenseReminder.findFirst.mockResolvedValue({
      id: reminderId,
      scheduledAt: new Date('2026-07-30T07:00:00.000Z'),
      expense: { id: 'expense-1', description: 'Assicurazione auto' },
    });

    await expect(service.summary('user-1', 7, now)).resolves.toEqual({
      activeCount: 8,
      upcomingCount: 4,
      dueCount: 1,
      processedCount: 22,
      cancelledCount: 3,
      nextReminder: {
        id: reminderId,
        scheduledAt: '2026-07-30T07:00:00.000Z',
        expenseId: 'expense-1',
        expenseDescription: 'Assicurazione auto',
      },
    });
  });

  it('non espone promemoria altrui', async () => {
    prisma.expenseReminder.findFirst.mockResolvedValue(null);
    await expect(service.findOne('other-user', reminderId)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.expenseReminder.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: reminderId, userId: 'other-user' },
    }));
  });

  it('delega la modifica al servizio contestuale mantenendo l’origine', async () => {
    prisma.expenseReminder.findFirst.mockResolvedValue(reminder({ source: ReminderSource.RECURRENCE }));
    const result = await service.update('user-1', reminderId, {
      type: ReminderType.SEVEN_DAYS_BEFORE,
    }, now);
    expect(contextual.update).toHaveBeenCalledWith('user-1', 'expense-1', reminderId, {
      type: ReminderType.SEVEN_DAYS_BEFORE,
      scheduledAt: undefined,
    });
    expect(result.source).toBe(ReminderSource.RECURRENCE);
  });

  it('rifiuta modifica processata e riattivazione con data trascorsa', async () => {
    prisma.expenseReminder.findFirst.mockResolvedValue(reminder({ processedAt: now }));
    await expect(service.update('user-1', reminderId, { type: ReminderType.SAME_DAY }, now))
      .rejects.toBeInstanceOf(ConflictException);

    prisma.expenseReminder.findFirst.mockResolvedValue(reminder({
      isActive: false,
      cancelledAt: now,
      scheduledAt: new Date('2026-07-27T10:00:00.000Z'),
    }));
    await expect(service.reactivate('user-1', reminderId, now))
      .rejects.toThrow('data prevista è già trascorsa');
  });

  it('impedisce l’eliminazione dello storico notificato e dei promemoria ricorrenti', async () => {
    prisma.expenseReminder.findFirst.mockResolvedValue(reminder({ notifications: [{}] }));
    await expect(service.remove('user-1', reminderId)).rejects.toThrow('notifica');
    prisma.expenseReminder.findFirst.mockResolvedValue(reminder({ source: ReminderSource.RECURRENCE }));
    await expect(service.remove('user-1', reminderId)).rejects.toThrow('ricorrenza');
  });

  it('restituisce un risultato parziale nelle operazioni massive', async () => {
    prisma.expenseReminder.findFirst.mockResolvedValue(reminder());
    vi.spyOn(service, 'cancel')
      .mockResolvedValueOnce({} as never)
      .mockRejectedValueOnce(new ConflictException('Il promemoria è già stato elaborato'));
    await expect(service.bulk('user-1', ['id-1', 'id-2'], 'cancel', now)).resolves.toEqual({
      requestedCount: 2,
      updatedCount: 1,
      skippedCount: 1,
      errors: [{ id: 'id-2', reason: 'ALREADY_PROCESSED' }],
    });
  });

  it('conteggia come saltati gli elementi bulk già nello stato richiesto', async () => {
    prisma.expenseReminder.findFirst.mockResolvedValue(reminder({
      isActive: false,
      cancelledAt: now,
    }));
    await expect(service.bulk('user-1', [reminderId], 'cancel', now)).resolves.toEqual({
      requestedCount: 1,
      updatedCount: 0,
      skippedCount: 1,
      errors: [],
    });
    expect(prisma.expenseReminder.update).not.toHaveBeenCalled();
  });
});

function prismaMock() {
  const expenseReminder = {
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  return {
    expenseReminder,
    $transaction: vi.fn((operations: Array<Promise<unknown>>) => Promise.all(operations)),
  };
}

function reminder(overrides: Record<string, unknown> = {}): ReminderWithRelations {
  return {
    id: reminderId,
    userId: 'user-1',
    expenseId: 'expense-1',
    type: ReminderType.THREE_DAYS_BEFORE,
    source: ReminderSource.MANUAL,
    offsetMinutes: 4_320,
    scheduledAt: new Date('2026-08-01T10:00:00.000Z'),
    isActive: true,
    processedAt: null,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
    notifications: [],
    expense: {
      id: 'expense-1',
      userId: 'user-1',
      categoryId: '10000000-0000-4000-8000-000000000001',
      description: 'Assicurazione auto',
      amount: new Prisma.Decimal('320.00'),
      expenseDate: new Date('2026-08-04T00:00:00.000Z'),
      expenseTime: null,
      merchant: 'Compagnia',
      paymentMethod: PaymentMethod.DIRECT_DEBIT,
      notes: null,
      status: ExpenseStatus.PLANNED,
      overdueNotifiedForDate: null,
      recurrenceRuleId: null,
      occurrenceDate: null,
      generatedByRecurrence: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      category: {
        id: '10000000-0000-4000-8000-000000000001',
        userId: null,
        name: 'Auto',
        slug: 'auto',
        description: null,
        icon: 'bi-car-front',
        color: '#2563EB',
        sortOrder: 1,
        isDefault: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      labels: [],
      recurrenceRule: null,
    },
    ...overrides,
  } as ReminderWithRelations;
}
