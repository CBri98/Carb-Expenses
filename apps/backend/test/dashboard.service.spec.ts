import { ExpenseStatus, PaymentMethod, Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardService } from '../src/dashboard/dashboard.service';
import { dateOnly, monthRange, previousMonth, shiftMonth } from '../src/dashboard/dashboard.utils';
import { PrismaService } from '../src/prisma/prisma.service';

const category = {
  id: 'category-1', userId: null, name: 'Casa', slug: 'casa', description: null,
  icon: 'bi-house', color: '#4F46E5', sortOrder: 1, isDefault: true, isActive: true,
  createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
};
const expense = {
  id: 'expense-1', userId: 'user-1', categoryId: category.id, description: 'Affitto',
  amount: new Prisma.Decimal('100.00'), expenseDate: dateOnly(2026, 7, 20), expenseTime: null,
  merchant: null, paymentMethod: PaymentMethod.BANK_TRANSFER, notes: null,
  status: ExpenseStatus.PLANNED, createdAt: new Date('2026-07-10T10:00:00Z'),
  updatedAt: new Date('2026-07-10T10:00:00Z'), deletedAt: null, category, labels: [],
};

describe('dashboard date utilities', () => {
  it('gestisce anno bisestile e passaggio gennaio/dicembre', () => {
    expect(monthRange(2024, 2).daysInMonth).toBe(29);
    expect(previousMonth(monthRange(2026, 1))).toMatchObject({ month: 12, year: 2025 });
    expect(shiftMonth(2026, 1, -2)).toMatchObject({ month: 11, year: 2025 });
  });
});

describe('DashboardService', () => {
  let prisma: ReturnType<typeof prismaMock>;
  let service: DashboardService;

  beforeEach(() => {
    prisma = prismaMock();
    service = new DashboardService(prisma as unknown as PrismaService);
  });

  it('calcola summary Decimal, confronto, media, categoria e pianificate escludendo per query gli stati non ammessi', async () => {
    prisma.expense.aggregate
      .mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal('300.00') }, _count: { _all: 3 } })
      .mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal('200.00') } })
      .mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal('100.00') } });
    prisma.expense.groupBy.mockResolvedValue([{ categoryId: category.id, _sum: { amount: new Prisma.Decimal('180.00') }, _count: { _all: 2 } }]);
    prisma.expense.findFirst.mockResolvedValue(expense);
    prisma.category.findUnique.mockResolvedValue(category);

    const result = await service.summary('user-1', { month: 7, year: 2026 }, new Date('2026-07-16T12:00:00Z'));

    expect(result).toMatchObject({
      totalSpent: '300.00', previousPeriodTotal: '200.00', absoluteChange: '100.00',
      percentageChange: 50, expenseCount: 3, dailyAverage: '18.75',
      plannedTotal: '100.00', changeDirection: 'INCREASE',
    });
    expect(result.topCategory).toMatchObject({ name: 'Casa', total: '180.00', percentage: 60 });
    expect(result.nextPlannedExpense).toMatchObject({ id: 'expense-1', daysUntilDue: 4 });
    const currentWhere = prisma.expense.aggregate.mock.calls[0]?.[0].where;
    expect(currentWhere).toMatchObject({ userId: 'user-1', deletedAt: null, status: 'COMPLETED' });
  });

  it('non produce Infinity quando il mese precedente è zero', async () => {
    prisma.expense.aggregate
      .mockResolvedValueOnce({ _sum: { amount: new Prisma.Decimal('10') }, _count: { _all: 1 } })
      .mockResolvedValueOnce({ _sum: { amount: null } })
      .mockResolvedValueOnce({ _sum: { amount: null } });
    prisma.expense.groupBy.mockResolvedValue([]);
    prisma.expense.findFirst.mockResolvedValue(null);
    const result = await service.summary('user-1', { month: 1, year: 2026 }, new Date('2026-01-10T12:00:00Z'));
    expect(result.percentageChange).toBeNull();
    expect(result.changeDirection).toBe('NOT_COMPARABLE');
  });

  it('riempie tutti i giorni di febbraio, compresi quelli senza spese', async () => {
    prisma.expense.groupBy.mockResolvedValue([{
      expenseDate: dateOnly(2024, 2, 2), _sum: { amount: new Prisma.Decimal('12.50') }, _count: { _all: 1 },
    }]);
    const result = await service.dailyTrend('user-1', { month: 2, year: 2024 });
    expect(result).toHaveLength(29);
    expect(result[0]).toMatchObject({ day: 1, total: '0.00', expenseCount: 0 });
    expect(result[1]).toMatchObject({ day: 2, total: '12.50', expenseCount: 1 });
  });

  it('ordina e calcola la distribuzione con categorie personalizzate', async () => {
    prisma.expense.groupBy.mockResolvedValue([
      { categoryId: 'custom', _sum: { amount: new Prisma.Decimal('75') }, _count: { _all: 3 } },
      { categoryId: category.id, _sum: { amount: new Prisma.Decimal('25') }, _count: { _all: 1 } },
    ]);
    prisma.category.findMany.mockResolvedValue([
      { ...category, id: 'custom', userId: 'user-1', name: 'Caffè' }, category,
    ]);
    const result = await service.categoryDistribution('user-1', { month: 7, year: 2026 });
    expect(result.map((item) => [item.name, item.total, item.percentage])).toEqual([
      ['Caffè', '75.00', 75], ['Casa', '25.00', 25],
    ]);
  });

  it('genera mesi a zero attraversando l’anno e filtra le prossime pianificate', async () => {
    prisma.expense.groupBy.mockResolvedValue([{
      expenseDate: dateOnly(2025, 12, 5), _sum: { amount: new Prisma.Decimal('90') }, _count: { _all: 2 },
    }]);
    const trend = await service.monthlyTrend('user-1', { month: 2, year: 2026, months: 6 });
    expect(trend).toHaveLength(6);
    expect(trend[0]).toMatchObject({ month: 9, year: 2025, total: '0.00' });
    expect(trend[3]).toMatchObject({ month: 12, year: 2025, total: '90.00' });

    prisma.expense.findMany.mockResolvedValue([expense]);
    const upcoming = await service.upcomingExpenses('user-1', { limit: 5 }, new Date('2026-07-16T12:00:00Z'));
    expect(upcoming[0]?.daysUntilDue).toBe(4);
    expect(prisma.expense.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: 'user-1', status: 'PLANNED', deletedAt: null }),
      take: 5,
    }));
  });
});

function prismaMock() {
  return {
    expense: {
      aggregate: vi.fn(), groupBy: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(),
    },
    category: { findUnique: vi.fn(), findMany: vi.fn() },
  };
}
