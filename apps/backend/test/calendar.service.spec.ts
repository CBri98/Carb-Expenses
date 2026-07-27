import { BadRequestException } from '@nestjs/common';
import { ExpenseStatus, PaymentMethod, Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CalendarMapper } from '../src/calendar/calendar.mapper';
import { CalendarService } from '../src/calendar/calendar.service';
import { CalendarExpensesQueryDto } from '../src/calendar/dto/calendar-expenses-query.dto';
import { dateOnly } from '../src/dashboard/dashboard.utils';
import { PrismaService } from '../src/prisma/prisma.service';

const category = {
  id: '11111111-1111-4111-8111-111111111111',
  userId: null,
  name: 'Casa',
  slug: 'casa',
  description: null,
  icon: 'bi-house',
  color: '#9BAFD6',
  sortOrder: 1,
  isDefault: true,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
};
const label = {
  id: '22222222-2222-4222-8222-222222222222',
  userId: 'user-1',
  categoryId: null,
  name: 'Casa nuova',
  slug: 'casa-nuova',
  icon: null,
  color: '#C9B8E4',
  description: null,
  isDefault: false,
  isActive: true,
  sortOrder: 1,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
};
const planned = {
  id: 'expense-1',
  userId: 'user-1',
  categoryId: category.id,
  description: 'Assicurazione casa',
  amount: new Prisma.Decimal('320.00'),
  expenseDate: dateOnly(2026, 7, 15),
  expenseTime: null,
  merchant: 'Compagnia',
  paymentMethod: PaymentMethod.DIRECT_DEBIT,
  notes: null,
  status: ExpenseStatus.PLANNED,
  createdAt: new Date('2026-07-01T08:00:00Z'),
  updatedAt: new Date('2026-07-01T08:00:00Z'),
  deletedAt: null,
  overdueNotifiedForDate: null,
  recurrenceRuleId: null,
  occurrenceDate: null,
  generatedByRecurrence: false,
  recurrenceRule: null,
  category,
  labels: [{ expenseId: 'expense-1', labelId: label.id, label }],
};

describe('CalendarMapper', () => {
  it('espone un evento all-day neutrale e segnala una pianificata scaduta', () => {
    expect(CalendarMapper.toEvent(planned, '2026-07-16')).toEqual(
      expect.objectContaining({
        id: 'expense-1',
        expenseId: 'expense-1',
        title: 'Assicurazione casa',
        amount: '320.00',
        expenseDate: '2026-07-15',
        expenseTime: null,
        allDay: true,
        status: ExpenseStatus.PLANNED,
        isOverdue: true,
      }),
    );
  });

  it('mantiene l’orario e non considera scaduta una spesa completata', () => {
    const event = CalendarMapper.toEvent({
      ...planned,
      status: ExpenseStatus.COMPLETED,
      expenseTime: new Date('1970-01-01T09:30:00Z'),
    }, '2026-07-16');
    expect(event).toMatchObject({ expenseTime: '09:30', allDay: false, isOverdue: false });
  });
});

describe('CalendarExpensesQueryDto', () => {
  it('normalizza filtri CSV validi e la ricerca', async () => {
    const dto = plainToInstance(CalendarExpensesQueryDto, {
      start: '2026-07-01',
      end: '2026-08-01',
      status: 'PLANNED,COMPLETED',
      labelIds: `${label.id},${label.id}`,
      categoryId: category.id,
      paymentMethod: PaymentMethod.CASH,
      search: '  treno   roma ',
    });
    await expect(validate(dto)).resolves.toHaveLength(1);
    expect(dto.status).toEqual([ExpenseStatus.PLANNED, ExpenseStatus.COMPLETED]);
    expect(dto.search).toBe('treno roma');
  });

  it('rifiuta date e valori filtro non validi', async () => {
    const dto = plainToInstance(CalendarExpensesQueryDto, {
      start: '01/07/2026',
      end: '2026-08-01',
      status: 'UNKNOWN',
      labelIds: 'not-an-uuid',
    });
    expect((await validate(dto)).length).toBeGreaterThanOrEqual(3);
  });
});

describe('CalendarService', () => {
  let prisma: ReturnType<typeof prismaMock>;
  let service: CalendarService;

  beforeEach(() => {
    prisma = prismaMock();
    service = new CalendarService(prisma as unknown as PrismaService);
  });

  it('limita per ownership, soft delete, intervallo end esclusivo e stati predefiniti', async () => {
    prisma.expense.findMany.mockResolvedValue([planned]);
    const events = await service.expenses(
      'user-1',
      { start: '2026-07-01', end: '2026-08-01' },
      new Date('2026-07-16T12:00:00Z'),
    );

    expect(events).toHaveLength(1);
    expect(prisma.expense.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        userId: 'user-1',
        deletedAt: null,
        expenseDate: {
          gte: dateOnly(2026, 7, 1),
          lt: dateOnly(2026, 8, 1),
        },
        status: { in: [ExpenseStatus.PLANNED, ExpenseStatus.COMPLETED] },
      }),
      orderBy: [
        { expenseDate: 'asc' },
        { expenseTime: 'asc' },
        { createdAt: 'asc' },
        { id: 'asc' },
      ],
    }));
  });

  it('applica categoria, etichette ANY, stato, pagamento e ricerca lato server', async () => {
    prisma.expense.findMany.mockResolvedValue([]);
    await service.expenses('owner-1', {
      start: '2026-07-01',
      end: '2026-07-08',
      status: [ExpenseStatus.CANCELLED],
      categoryId: category.id,
      labelIds: [label.id],
      paymentMethod: PaymentMethod.CASH,
      search: 'metro',
    });
    expect(prisma.expense.findMany.mock.calls[0]?.[0].where).toMatchObject({
      userId: 'owner-1',
      status: { in: [ExpenseStatus.CANCELLED] },
      categoryId: category.id,
      paymentMethod: PaymentMethod.CASH,
      labels: { some: { labelId: { in: [label.id] } } },
      OR: [
        { description: { contains: 'metro' } },
        { merchant: { contains: 'metro' } },
      ],
    });
  });

  it.each([
    [{ start: '2026-02-30', end: '2026-03-02' }, 'data non valida'],
    [{ start: '2026-07-10', end: '2026-07-10' }, 'end non successiva'],
    [{ start: '2025-01-01', end: '2026-01-03' }, 'oltre 366 giorni'],
  ])('rifiuta %s (%s)', async (query) => {
    await expect(service.expenses('user-1', query)).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.expense.findMany).not.toHaveBeenCalled();
  });
});

function prismaMock() {
  return {
    expense: { findMany: vi.fn() },
  };
}
