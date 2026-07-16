import { ExpenseStatus, PaymentMethod, Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { dateOnly } from '../src/dashboard/dashboard.utils';
import { ExpensesService } from '../src/expenses/expenses.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ReportsMapper } from '../src/reports/reports.mapper';
import { ReportsService } from '../src/reports/reports.service';

const category = {
  id: 'category-1',
  userId: null,
  name: 'Casa',
  slug: 'casa',
  description: null,
  icon: 'bi-house',
  color: '#4F46E5',
  sortOrder: 1,
  isDefault: true,
  isActive: true,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  deletedAt: null,
};

describe('ReportsMapper', () => {
  it('applica tutti i casi limite percentuali senza Infinity o NaN', () => {
    expect(ReportsMapper.change(new Prisma.Decimal(0), new Prisma.Decimal(0))).toEqual({
      absoluteChange: '0.00',
      percentageChange: 0,
      direction: 'UNCHANGED',
    });
    expect(ReportsMapper.change(new Prisma.Decimal(0), new Prisma.Decimal(10))).toMatchObject({
      percentageChange: null,
      direction: 'NOT_COMPARABLE',
    });
    expect(ReportsMapper.change(new Prisma.Decimal(10), new Prisma.Decimal(0))).toMatchObject({
      absoluteChange: '-10.00',
      percentageChange: -100,
      direction: 'DECREASE',
    });
  });

  it('mantiene i conteggi interi e gli importi a due decimali', () => {
    expect(ReportsMapper.metric('COMPLETED_COUNT', new Prisma.Decimal(2), new Prisma.Decimal(5), 'COUNT'))
      .toMatchObject({ periodAValue: '2', periodBValue: '5', absoluteChange: '3' });
    expect(ReportsMapper.metric('COMPLETED_TOTAL', new Prisma.Decimal('2.5'), new Prisma.Decimal(5), 'MONEY'))
      .toMatchObject({ periodAValue: '2.50', periodBValue: '5.00', absoluteChange: '2.50' });
  });
});

describe('ReportsService', () => {
  let prisma: ReturnType<typeof prismaMock>;
  let expenses: { findAll: ReturnType<typeof vi.fn> };
  let service: ReportsService;

  beforeEach(() => {
    prisma = prismaMock();
    expenses = { findAll: vi.fn() };
    service = new ReportsService(
      prisma as unknown as PrismaService,
      expenses as unknown as ExpensesService,
    );
  });

  it('calcola il report mensile completo con stati separati, Decimal, parità giornaliera e ownership', async () => {
    prisma.expense.groupBy
      .mockResolvedValueOnce([
        { status: ExpenseStatus.COMPLETED, _sum: { amount: new Prisma.Decimal('310') }, _count: { _all: 3 } },
        { status: ExpenseStatus.PLANNED, _sum: { amount: new Prisma.Decimal('80') }, _count: { _all: 2 } },
        { status: ExpenseStatus.CANCELLED, _sum: { amount: new Prisma.Decimal('500') }, _count: { _all: 1 } },
      ])
      .mockResolvedValueOnce([
        { expenseDate: dateOnly(2026, 7, 2), status: ExpenseStatus.COMPLETED, _sum: { amount: new Prisma.Decimal('150') }, _count: { _all: 1 } },
        { expenseDate: dateOnly(2026, 7, 3), status: ExpenseStatus.COMPLETED, _sum: { amount: new Prisma.Decimal('150') }, _count: { _all: 2 } },
        { expenseDate: dateOnly(2026, 7, 20), status: ExpenseStatus.PLANNED, _sum: { amount: new Prisma.Decimal('80') }, _count: { _all: 2 } },
      ])
      .mockResolvedValueOnce([
        { categoryId: category.id, _sum: { amount: new Prisma.Decimal('310') }, _count: { _all: 3 } },
      ])
      .mockResolvedValueOnce([
        { paymentMethod: PaymentMethod.DEBIT_CARD, _sum: { amount: new Prisma.Decimal('310') }, _count: { _all: 3 } },
      ]);
    prisma.expense.findFirst.mockResolvedValue({
      id: 'expense-high',
      userId: 'user-1',
      categoryId: category.id,
      description: 'Assicurazione',
      amount: new Prisma.Decimal('160'),
      expenseDate: dateOnly(2026, 7, 8),
      expenseTime: null,
      merchant: null,
      paymentMethod: PaymentMethod.DEBIT_CARD,
      notes: null,
      status: ExpenseStatus.COMPLETED,
      createdAt: new Date('2026-07-08T10:00:00Z'),
      updatedAt: new Date('2026-07-08T10:00:00Z'),
      deletedAt: null,
      category,
    });
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal('200') } });
    prisma.category.findMany.mockResolvedValue([category]);

    const report = await service.monthly(
      'user-1',
      { month: 7, year: 2026 },
      new Date('2026-07-16T12:00:00Z'),
    );

    expect(report.summary).toEqual({
      completedTotal: '310.00',
      plannedTotal: '80.00',
      completedCount: 3,
      plannedCount: 2,
      cancelledCount: 1,
      dailyAverage: '19.38',
      transactionAverage: '103.33',
    });
    expect(report.dailyTrend).toHaveLength(31);
    expect(report.dailyTrend[0]).toMatchObject({ completedTotal: '0.00', plannedTotal: '0.00' });
    expect(report.highestSpendingDay).toMatchObject({ date: '2026-07-02', total: '150.00' });
    expect(report.highestExpense).toMatchObject({ description: 'Assicurazione', amount: '160.00' });
    expect(report.topCategory).toMatchObject({ name: 'Casa', total: '310.00', percentage: 100 });
    expect(report.paymentMethodBreakdown[0]).toMatchObject({ paymentMethod: 'DEBIT_CARD', percentage: 100 });
    expect(report.previousMonthComparison).toMatchObject({ absoluteChange: '110.00', percentageChange: 55 });
    expect(prisma.expense.groupBy.mock.calls[0]?.[0].where).toMatchObject({
      userId: 'user-1',
      deletedAt: null,
    });
  });

  it('gestisce mese vuoto, febbraio bisestile e passaggio anno', async () => {
    prisma.expense.groupBy.mockResolvedValue([]);
    prisma.expense.findFirst.mockResolvedValue(null);
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: null } });

    const report = await service.monthly(
      'user-2',
      { month: 2, year: 2024 },
      new Date('2026-01-01T12:00:00Z'),
    );

    expect(report.dailyTrend).toHaveLength(29);
    expect(report.summary).toMatchObject({
      completedTotal: '0.00',
      plannedTotal: '0.00',
      dailyAverage: '0.00',
      transactionAverage: '0.00',
    });
    expect(report.highestSpendingDay).toBeNull();
    const previousWhere = prisma.expense.aggregate.mock.calls[0]?.[0].where;
    expect(previousWhere.expenseDate.gte).toEqual(dateOnly(2024, 1, 1));
  });

  it('confronta mesi di durata diversa, mantiene il giorno 31 null e gestisce A uguale a zero', async () => {
    prisma.expense.groupBy.mockImplementation((args: { by: string[]; where: { expenseDate: { gte: Date } } }) => {
      if (args.by.length !== 1 || args.by[0] !== 'status') return Promise.resolve([]);
      const month = args.where.expenseDate.gte.getUTCMonth() + 1;
      return Promise.resolve(month === 7
        ? [{ status: ExpenseStatus.COMPLETED, _sum: { amount: new Prisma.Decimal('100') }, _count: { _all: 2 } }]
        : []);
    });
    prisma.expense.findFirst.mockResolvedValue(null);
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: null } });

    const comparison = await service.monthComparison(
      'user-1',
      { monthA: 6, yearA: 2026, monthB: 7, yearB: 2026 },
    );

    expect(comparison.metrics.find((item) => item.metric === 'COMPLETED_TOTAL')).toMatchObject({
      periodAValue: '0.00',
      periodBValue: '100.00',
      percentageChange: null,
      direction: 'NOT_COMPARABLE',
    });
    expect(comparison.daily).toHaveLength(31);
    expect(comparison.daily[30]).toMatchObject({
      day: 31,
      periodATotal: null,
      periodBTotal: '0.00',
    });
  });

  it('delega l’elenco mensile al servizio spese conservando periodo, filtri e ownership', async () => {
    expenses.findAll.mockResolvedValue({ data: [], meta: { page: 2 } });
    const query = {
      month: 7,
      year: 2026,
      page: 2,
      pageSize: 10,
      search: 'treno',
      sortBy: 'amount' as const,
      sortDirection: 'asc' as const,
    };
    await service.monthlyExpenses('owner-1', query);
    expect(expenses.findAll).toHaveBeenCalledWith('owner-1', query);
  });
});

function prismaMock() {
  return {
    expense: {
      groupBy: vi.fn(),
      findFirst: vi.fn(),
      aggregate: vi.fn(),
    },
    category: { findMany: vi.fn() },
  };
}
