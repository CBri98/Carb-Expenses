import { BadRequestException, Injectable } from '@nestjs/common';
import { ExpenseStatus, Prisma, type PaymentMethod } from '@prisma/client';

import type { ApiPayload } from '../common/interceptors/api-response.interceptor';
import {
  dateOnly,
  isoDate,
  monthRange,
  previousMonth,
  romeCalendarDate,
  type DashboardMonthRange,
} from '../dashboard/dashboard.utils';
import { ExpensesService } from '../expenses/expenses.service';
import type { ExpenseResponse } from '../expenses/expenses.types';
import { PrismaService } from '../prisma/prisma.service';
import type {
  DailyComparisonQueryDto,
  MonthComparisonQueryDto,
} from './dto/month-comparison-query.dto';
import type { MonthlyExpensesQueryDto } from './dto/monthly-expenses-query.dto';
import type { MonthlyReportQueryDto } from './dto/monthly-report-query.dto';
import { ReportsMapper } from './reports.mapper';
import type {
  CategoryComparisonItem,
  CategoryReportItem,
  DailyComparisonPoint,
  DailyReportPoint,
  MonthComparison,
  MonthlyReport,
  PaymentMethodComparisonItem,
  PaymentMethodReportItem,
  ReportCategory,
} from './reports.types';

const ZERO = new Prisma.Decimal(0);

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly expenses: ExpensesService,
  ) {}

  async monthly(
    userId: string,
    query: MonthlyReportQueryDto,
    now = new Date(),
  ): Promise<MonthlyReport> {
    const selected = monthRange(query.year, query.month);
    const previous = previousMonth(selected);
    const current = romeCalendarDate(now);
    const base = this.periodWhere(userId, selected);

    const [statusGroups, dailyGroups, categoryGroups, paymentGroups, highest, previousAggregate] =
      await Promise.all([
        this.prisma.expense.groupBy({
          by: ['status'],
          where: base,
          _sum: { amount: true },
          _count: { _all: true },
        }),
        this.prisma.expense.groupBy({
          by: ['expenseDate', 'status'],
          where: {
            ...base,
            status: { in: [ExpenseStatus.COMPLETED, ExpenseStatus.PLANNED] },
          },
          _sum: { amount: true },
          _count: { _all: true },
          orderBy: { expenseDate: 'asc' },
        }),
        this.prisma.expense.groupBy({
          by: ['categoryId'],
          where: { ...base, status: ExpenseStatus.COMPLETED },
          _sum: { amount: true },
          _count: { _all: true },
          orderBy: { _sum: { amount: 'desc' } },
        }),
        this.prisma.expense.groupBy({
          by: ['paymentMethod'],
          where: { ...base, status: ExpenseStatus.COMPLETED },
          _sum: { amount: true },
          _count: { _all: true },
          orderBy: { _sum: { amount: 'desc' } },
        }),
        this.prisma.expense.findFirst({
          where: { ...base, status: ExpenseStatus.COMPLETED },
          include: { category: true },
          orderBy: [
            { amount: 'desc' },
            { expenseDate: 'desc' },
            { createdAt: 'desc' },
            { id: 'desc' },
          ],
        }),
        this.prisma.expense.aggregate({
          where: {
            ...this.periodWhere(userId, previous),
            status: ExpenseStatus.COMPLETED,
          },
          _sum: { amount: true },
        }),
      ]);

    const statusByName = new Map(statusGroups.map((group) => [group.status, group]));
    const completed = statusByName.get(ExpenseStatus.COMPLETED);
    const planned = statusByName.get(ExpenseStatus.PLANNED);
    const cancelled = statusByName.get(ExpenseStatus.CANCELLED);
    const completedTotal = completed?._sum.amount ?? ZERO;
    const plannedTotal = planned?._sum.amount ?? ZERO;
    const completedCount = completed?._count._all ?? 0;
    const averageDays =
      selected.year === current.year && selected.month === current.month
        ? Math.max(current.day, 1)
        : selected.daysInMonth;

    const categories = categoryGroups.length
      ? await this.prisma.category.findMany({
          where: { id: { in: categoryGroups.map((group) => group.categoryId) } },
        })
      : [];
    const categoryById = new Map(categories.map((category) => [category.id, category]));
    const categoryDistribution = categoryGroups.flatMap((group): CategoryReportItem[] => {
      const category = categoryById.get(group.categoryId);
      if (!category) return [];
      const total = group._sum.amount ?? ZERO;
      return [{
        ...this.category(category),
        categoryId: category.id,
        total: ReportsMapper.money(total),
        expenseCount: group._count._all,
        averageAmount: ReportsMapper.money(
          group._count._all === 0 ? ZERO : total.div(group._count._all),
        ),
        percentage: completedTotal.isZero()
          ? 0
          : ReportsMapper.percentage(total.div(completedTotal).mul(100)),
      }];
    });

    const dailyTrend = this.dailyTrend(selected, dailyGroups);
    const highestDay = dailyTrend.reduce<DailyReportPoint | null>((best, point) => {
      if (point.completedCount === 0) return best;
      if (!best) return point;
      return new Prisma.Decimal(point.completedTotal).greaterThan(best.completedTotal)
        ? point
        : best;
    }, null);
    const previousTotal = previousAggregate._sum.amount ?? ZERO;
    const previousChange = ReportsMapper.change(previousTotal, completedTotal);

    return {
      period: ReportsMapper.period(selected, current),
      summary: {
        completedTotal: ReportsMapper.money(completedTotal),
        plannedTotal: ReportsMapper.money(plannedTotal),
        completedCount,
        plannedCount: planned?._count._all ?? 0,
        cancelledCount: cancelled?._count._all ?? 0,
        dailyAverage: ReportsMapper.money(
          completedTotal.isZero() ? ZERO : completedTotal.div(averageDays),
        ),
        transactionAverage: ReportsMapper.money(
          completedCount === 0 ? ZERO : completedTotal.div(completedCount),
        ),
      },
      highestSpendingDay: highestDay
        ? {
            date: highestDay.date,
            total: highestDay.completedTotal,
            expenseCount: highestDay.completedCount,
          }
        : null,
      highestExpense: highest
        ? {
            id: highest.id,
            description: highest.description,
            amount: ReportsMapper.money(highest.amount),
            expenseDate: isoDate(highest.expenseDate),
            category: this.category(highest.category),
          }
        : null,
      topCategory: categoryDistribution[0] ?? null,
      categoryDistribution,
      dailyTrend,
      paymentMethodBreakdown: paymentGroups.map((group): PaymentMethodReportItem => {
        const total = group._sum.amount ?? ZERO;
        return {
          paymentMethod: group.paymentMethod,
          total: ReportsMapper.money(total),
          expenseCount: group._count._all,
          percentage: completedTotal.isZero()
            ? 0
            : ReportsMapper.percentage(total.div(completedTotal).mul(100)),
        };
      }),
      previousMonthComparison: {
        previousTotal: ReportsMapper.money(previousTotal),
        ...previousChange,
      },
    };
  }

  monthlyExpenses(
    userId: string,
    query: MonthlyExpensesQueryDto,
  ): Promise<ApiPayload<ExpenseResponse[]>> {
    if (!query.month || !query.year) {
      throw new BadRequestException('Mese e anno sono obbligatori');
    }
    return this.expenses.findAll(userId, query);
  }

  async monthComparison(
    userId: string,
    query: MonthComparisonQueryDto,
    now = new Date(),
  ): Promise<MonthComparison> {
    const [reportA, reportB] = await Promise.all([
      this.monthly(userId, { month: query.monthA, year: query.yearA }, now),
      this.monthly(userId, { month: query.monthB, year: query.yearB }, now),
    ]);
    return {
      periodA: reportA.period,
      periodB: reportB.period,
      samePeriod: query.monthA === query.monthB && query.yearA === query.yearB,
      metrics: this.metrics(reportA, reportB),
      categories: this.compareCategories(
        reportA.categoryDistribution,
        reportB.categoryDistribution,
      ),
      daily: this.compareDaily(reportA, reportB),
      paymentMethods: this.comparePaymentMethods(
        reportA.paymentMethodBreakdown,
        reportB.paymentMethodBreakdown,
      ),
    };
  }

  async categoryComparison(
    userId: string,
    query: MonthComparisonQueryDto,
    now = new Date(),
  ): Promise<CategoryComparisonItem[]> {
    return (await this.monthComparison(userId, query, now)).categories;
  }

  async dailyComparison(
    userId: string,
    query: DailyComparisonQueryDto,
    now = new Date(),
  ): Promise<DailyComparisonPoint[]> {
    return (await this.monthComparison(userId, query, now)).daily;
  }

  private metrics(reportA: MonthlyReport, reportB: MonthlyReport) {
    const money = (value: string): Prisma.Decimal => new Prisma.Decimal(value);
    const count = (value: number): Prisma.Decimal => new Prisma.Decimal(value);
    return [
      ReportsMapper.metric('COMPLETED_TOTAL', money(reportA.summary.completedTotal), money(reportB.summary.completedTotal), 'MONEY'),
      ReportsMapper.metric('PLANNED_TOTAL', money(reportA.summary.plannedTotal), money(reportB.summary.plannedTotal), 'MONEY'),
      ReportsMapper.metric('COMPLETED_COUNT', count(reportA.summary.completedCount), count(reportB.summary.completedCount), 'COUNT'),
      ReportsMapper.metric('PLANNED_COUNT', count(reportA.summary.plannedCount), count(reportB.summary.plannedCount), 'COUNT'),
      ReportsMapper.metric('DAILY_AVERAGE', money(reportA.summary.dailyAverage), money(reportB.summary.dailyAverage), 'MONEY'),
      ReportsMapper.metric('TRANSACTION_AVERAGE', money(reportA.summary.transactionAverage), money(reportB.summary.transactionAverage), 'MONEY'),
      ReportsMapper.metric('HIGHEST_EXPENSE', money(reportA.highestExpense?.amount ?? '0'), money(reportB.highestExpense?.amount ?? '0'), 'MONEY'),
      ReportsMapper.metric('CATEGORY_COUNT', count(reportA.categoryDistribution.length), count(reportB.categoryDistribution.length), 'COUNT'),
    ];
  }

  private compareCategories(
    periodA: CategoryReportItem[],
    periodB: CategoryReportItem[],
  ): CategoryComparisonItem[] {
    const mapA = new Map(periodA.map((item) => [item.categoryId, item]));
    const mapB = new Map(periodB.map((item) => [item.categoryId, item]));
    const ids = new Set([...mapA.keys(), ...mapB.keys()]);
    return [...ids]
      .map((categoryId): CategoryComparisonItem => {
        const a = mapA.get(categoryId);
        const b = mapB.get(categoryId);
        const category = a ?? b;
        if (!category) throw new Error('Categoria di confronto non disponibile');
        const totalA = new Prisma.Decimal(a?.total ?? 0);
        const totalB = new Prisma.Decimal(b?.total ?? 0);
        return {
          id: category.id,
          categoryId,
          name: category.name,
          color: category.color,
          icon: category.icon,
          periodATotal: ReportsMapper.money(totalA),
          periodBTotal: ReportsMapper.money(totalB),
          periodACount: a?.expenseCount ?? 0,
          periodBCount: b?.expenseCount ?? 0,
          ...ReportsMapper.change(totalA, totalB),
        };
      })
      .sort((left, right) => {
        const leftMax = Prisma.Decimal.max(left.periodATotal, left.periodBTotal);
        const rightMax = Prisma.Decimal.max(right.periodATotal, right.periodBTotal);
        return rightMax.comparedTo(leftMax) || left.name.localeCompare(right.name, 'it');
      });
  }

  private compareDaily(reportA: MonthlyReport, reportB: MonthlyReport): DailyComparisonPoint[] {
    const length = Math.max(reportA.period.daysInMonth, reportB.period.daysInMonth);
    return Array.from({ length }, (_, index) => {
      const a = reportA.dailyTrend[index];
      const b = reportB.dailyTrend[index];
      return {
        day: index + 1,
        periodADate: a?.date ?? null,
        periodBDate: b?.date ?? null,
        periodATotal: a?.completedTotal ?? null,
        periodBTotal: b?.completedTotal ?? null,
        periodACount: a?.completedCount ?? null,
        periodBCount: b?.completedCount ?? null,
      };
    });
  }

  private comparePaymentMethods(
    periodA: PaymentMethodReportItem[],
    periodB: PaymentMethodReportItem[],
  ): PaymentMethodComparisonItem[] {
    const mapA = new Map(periodA.map((item) => [item.paymentMethod, item]));
    const mapB = new Map(periodB.map((item) => [item.paymentMethod, item]));
    const methods = new Set<PaymentMethod>([...mapA.keys(), ...mapB.keys()]);
    return [...methods]
      .map((paymentMethod): PaymentMethodComparisonItem => {
        const a = mapA.get(paymentMethod);
        const b = mapB.get(paymentMethod);
        const totalA = new Prisma.Decimal(a?.total ?? 0);
        const totalB = new Prisma.Decimal(b?.total ?? 0);
        return {
          paymentMethod,
          periodATotal: ReportsMapper.money(totalA),
          periodBTotal: ReportsMapper.money(totalB),
          periodACount: a?.expenseCount ?? 0,
          periodBCount: b?.expenseCount ?? 0,
          ...ReportsMapper.change(totalA, totalB),
        };
      })
      .sort((left, right) => {
        const leftMax = Prisma.Decimal.max(left.periodATotal, left.periodBTotal);
        const rightMax = Prisma.Decimal.max(right.periodATotal, right.periodBTotal);
        return rightMax.comparedTo(leftMax);
      });
  }

  private dailyTrend(
    selected: DashboardMonthRange,
    groups: Array<{
      expenseDate: Date;
      status: ExpenseStatus;
      _sum: { amount: Prisma.Decimal | null };
      _count: { _all: number };
    }>,
  ): DailyReportPoint[] {
    const byDateStatus = new Map(
      groups.map((group) => [`${isoDate(group.expenseDate)}:${group.status}`, group]),
    );
    return Array.from({ length: selected.daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = isoDate(dateOnly(selected.year, selected.month, day));
      const completed = byDateStatus.get(`${date}:${ExpenseStatus.COMPLETED}`);
      const planned = byDateStatus.get(`${date}:${ExpenseStatus.PLANNED}`);
      return {
        date,
        day,
        completedTotal: ReportsMapper.money(completed?._sum.amount),
        plannedTotal: ReportsMapper.money(planned?._sum.amount),
        completedCount: completed?._count._all ?? 0,
        plannedCount: planned?._count._all ?? 0,
      };
    });
  }

  private category(category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  }): ReportCategory {
    return {
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
    };
  }

  private periodWhere(
    userId: string,
    selected: DashboardMonthRange,
  ): Prisma.ExpenseWhereInput {
    return {
      userId,
      deletedAt: null,
      expenseDate: { gte: selected.start, lt: selected.endExclusive },
    };
  }
}
