import { BadRequestException, Injectable } from '@nestjs/common';
import { ExpenseStatus, Prisma } from '@prisma/client';

import { ExpenseMapper } from '../expenses/expense.mapper';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardMapper } from './dashboard.mapper';
import type { CategoryDistributionItem, DailyTrendPoint, DashboardExpenseWithRelations, DashboardSummary, MonthlyTrendPoint, UpcomingExpense } from './dashboard.types';
import { dateOnly, isoDate, monthRange, previousMonth, romeCalendarDate, shiftMonth, type DashboardMonthRange } from './dashboard.utils';
import type { DashboardListQueryDto } from './dto/dashboard-list-query.dto';
import type { DashboardPeriodQueryDto } from './dto/dashboard-period-query.dto';
import type { MonthlyTrendQueryDto } from './dto/monthly-trend-query.dto';

const expenseInclude = {
  category: true,
  labels: { include: { label: true } },
  recurrenceRule: { select: { id: true, name: true, status: true } },
} satisfies Prisma.ExpenseInclude;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(userId: string, query: DashboardPeriodQueryDto, now = new Date()): Promise<DashboardSummary> {
    const current = romeCalendarDate(now);
    const selected = this.period(query, current);
    const previous = previousMonth(selected);
    const today = dateOnly(current.year, current.month, current.day);
    const completed = this.completed(userId, selected);
    const planned: Prisma.ExpenseWhereInput = {
      userId, deletedAt: null, status: ExpenseStatus.PLANNED, expenseDate: { gte: today },
    };
    const [selectedAgg, previousAgg, topGroups, plannedAgg, next] = await Promise.all([
      this.prisma.expense.aggregate({ where: completed, _sum: { amount: true }, _count: { _all: true } }),
      this.prisma.expense.aggregate({ where: this.completed(userId, previous), _sum: { amount: true } }),
      this.prisma.expense.groupBy({
        by: ['categoryId'], where: completed, _sum: { amount: true }, _count: { _all: true },
        orderBy: { _sum: { amount: 'desc' } }, take: 1,
      }),
      this.prisma.expense.aggregate({ where: planned, _sum: { amount: true } }),
      this.prisma.expense.findFirst({
        where: planned, include: expenseInclude,
        orderBy: [{ expenseDate: 'asc' }, { expenseTime: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);
    const total = selectedAgg._sum.amount ?? new Prisma.Decimal(0);
    const previousTotal = previousAgg._sum.amount ?? new Prisma.Decimal(0);
    const change = total.minus(previousTotal);
    const percentageChange = previousTotal.isZero()
      ? null
      : DashboardMapper.percentage(change.div(previousTotal).mul(100));
    const topGroup = topGroups[0];
    const category = topGroup
      ? await this.prisma.category.findUnique({ where: { id: topGroup.categoryId } })
      : null;
    const isCurrentMonth = selected.year === current.year && selected.month === current.month;
    const averageDays = isCurrentMonth ? Math.max(current.day, 1) : selected.daysInMonth;
    return {
      period: { month: selected.month, year: selected.year, label: selected.label, isCurrentMonth },
      totalSpent: DashboardMapper.money(total),
      previousPeriodTotal: DashboardMapper.money(previousTotal),
      absoluteChange: DashboardMapper.money(change),
      percentageChange,
      changeDirection: previousTotal.isZero() && total.greaterThan(0)
        ? 'NOT_COMPARABLE'
        : change.greaterThan(0) ? 'INCREASE' : change.lessThan(0) ? 'DECREASE' : 'UNCHANGED',
      expenseCount: selectedAgg._count._all,
      dailyAverage: DashboardMapper.money(total.div(averageDays)),
      topCategory: topGroup && category && topGroup._sum.amount ? {
        id: category.id, name: category.name, color: category.color, icon: category.icon,
        total: DashboardMapper.money(topGroup._sum.amount),
        percentage: total.isZero() ? 0 : DashboardMapper.percentage(topGroup._sum.amount.div(total).mul(100)),
      } : null,
      plannedTotal: DashboardMapper.money(plannedAgg._sum.amount),
      nextPlannedExpense: next
        ? DashboardMapper.plannedExpense(next as DashboardExpenseWithRelations, today)
        : null,
    };
  }

  async dailyTrend(userId: string, query: DashboardPeriodQueryDto, now = new Date()): Promise<DailyTrendPoint[]> {
    const selected = this.period(query, romeCalendarDate(now));
    const groups = await this.prisma.expense.groupBy({
      by: ['expenseDate'], where: this.completed(userId, selected),
      _sum: { amount: true }, _count: { _all: true }, orderBy: { expenseDate: 'asc' },
    });
    const byDate = new Map(groups.map((group) => [isoDate(group.expenseDate), group]));
    return Array.from({ length: selected.daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = isoDate(dateOnly(selected.year, selected.month, day));
      const group = byDate.get(date);
      return { date, day, total: DashboardMapper.money(group?._sum.amount), expenseCount: group?._count._all ?? 0 };
    });
  }

  async categoryDistribution(userId: string, query: DashboardPeriodQueryDto, now = new Date()): Promise<CategoryDistributionItem[]> {
    const selected = this.period(query, romeCalendarDate(now));
    const groups = await this.prisma.expense.groupBy({
      by: ['categoryId'], where: this.completed(userId, selected),
      _sum: { amount: true }, _count: { _all: true }, orderBy: { _sum: { amount: 'desc' } },
    });
    if (groups.length === 0) return [];
    const categories = await this.prisma.category.findMany({
      where: { id: { in: groups.map((group) => group.categoryId) } },
    });
    const byId = new Map(categories.map((category) => [category.id, category]));
    const grandTotal = groups.reduce((sum, group) => sum.plus(group._sum.amount ?? 0), new Prisma.Decimal(0));
    return groups.flatMap((group) => {
      const category = byId.get(group.categoryId);
      const total = group._sum.amount ?? new Prisma.Decimal(0);
      return category ? [{
        categoryId: category.id, id: category.id, name: category.name, color: category.color, icon: category.icon,
        total: DashboardMapper.money(total), expenseCount: group._count._all,
        percentage: grandTotal.isZero() ? 0 : DashboardMapper.percentage(total.div(grandTotal).mul(100)),
      }] : [];
    });
  }

  async monthlyTrend(userId: string, query: MonthlyTrendQueryDto, now = new Date()): Promise<MonthlyTrendPoint[]> {
    const selected = this.period(query, romeCalendarDate(now));
    const first = shiftMonth(selected.year, selected.month, -(query.months - 1));
    const groups = await this.prisma.expense.groupBy({
      by: ['expenseDate'],
      where: {
        userId, deletedAt: null, status: ExpenseStatus.COMPLETED,
        expenseDate: { gte: first.start, lt: selected.endExclusive },
      },
      _sum: { amount: true }, _count: { _all: true }, orderBy: { expenseDate: 'asc' },
    });
    const buckets = new Map<string, { total: Prisma.Decimal; count: number }>();
    for (const group of groups) {
      const key = `${group.expenseDate.getUTCFullYear()}-${group.expenseDate.getUTCMonth() + 1}`;
      const bucket = buckets.get(key) ?? { total: new Prisma.Decimal(0), count: 0 };
      bucket.total = bucket.total.plus(group._sum.amount ?? 0);
      bucket.count += group._count._all;
      buckets.set(key, bucket);
    }
    return Array.from({ length: query.months }, (_, index) => {
      const item = shiftMonth(first.year, first.month, index);
      const bucket = buckets.get(`${item.year}-${item.month}`);
      return {
        month: item.month, year: item.year, label: item.shortLabel,
        total: DashboardMapper.money(bucket?.total), expenseCount: bucket?.count ?? 0,
      };
    });
  }

  async recentExpenses(userId: string, query: DashboardListQueryDto) {
    const expenses = await this.prisma.expense.findMany({
      where: { userId, deletedAt: null }, include: expenseInclude,
      orderBy: { createdAt: 'desc' }, take: query.limit,
    });
    return expenses.map((expense) => ExpenseMapper.toResponse(expense));
  }

  async upcomingExpenses(userId: string, query: DashboardListQueryDto, now = new Date()): Promise<UpcomingExpense[]> {
    const current = romeCalendarDate(now);
    const today = dateOnly(current.year, current.month, current.day);
    const expenses = await this.prisma.expense.findMany({
      where: { userId, deletedAt: null, status: ExpenseStatus.PLANNED, expenseDate: { gte: today } },
      include: expenseInclude,
      orderBy: [{ expenseDate: 'asc' }, { expenseTime: 'asc' }, { createdAt: 'asc' }],
      take: query.limit,
    });
    return expenses.map((expense) => DashboardMapper.upcomingExpense(expense, today));
  }

  private period(query: DashboardPeriodQueryDto, current: { year: number; month: number }): DashboardMonthRange {
    if ((query.month === undefined) !== (query.year === undefined)) {
      throw new BadRequestException('Mese e anno devono essere specificati insieme');
    }
    return monthRange(query.year ?? current.year, query.month ?? current.month);
  }

  private completed(userId: string, selected: DashboardMonthRange): Prisma.ExpenseWhereInput {
    return {
      userId, deletedAt: null, status: ExpenseStatus.COMPLETED,
      expenseDate: { gte: selected.start, lt: selected.endExclusive },
    };
  }
}
