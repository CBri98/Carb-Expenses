import { Prisma } from '@prisma/client';

import { DashboardMapper } from '../dashboard/dashboard.mapper';
import type { DashboardMonthRange } from '../dashboard/dashboard.utils';
import type {
  ComparisonDirection,
  ComparisonMetric,
  ComparisonMetricName,
  ReportPeriod,
} from './reports.types';

export interface ComparisonChange {
  absoluteChange: string;
  percentageChange: number | null;
  direction: ComparisonDirection;
}

export class ReportsMapper {
  static money(value: Prisma.Decimal | string | number | null | undefined): string {
    if (value instanceof Prisma.Decimal) return DashboardMapper.money(value);
    return DashboardMapper.money(value == null ? undefined : new Prisma.Decimal(value));
  }

  static percentage(value: Prisma.Decimal): number {
    return DashboardMapper.percentage(value);
  }

  static period(
    range: DashboardMonthRange,
    current: { month: number; year: number },
  ): ReportPeriod {
    return {
      month: range.month,
      year: range.year,
      label: range.label,
      shortLabel: range.shortLabel,
      daysInMonth: range.daysInMonth,
      isCurrentMonth: range.month === current.month && range.year === current.year,
    };
  }

  static change(periodA: Prisma.Decimal, periodB: Prisma.Decimal): ComparisonChange {
    const absolute = periodB.minus(periodA);
    if (periodA.isZero() && periodB.isZero()) {
      return { absoluteChange: '0.00', percentageChange: 0, direction: 'UNCHANGED' };
    }
    if (periodA.isZero()) {
      return {
        absoluteChange: ReportsMapper.money(absolute),
        percentageChange: null,
        direction: 'NOT_COMPARABLE',
      };
    }
    return {
      absoluteChange: ReportsMapper.money(absolute),
      percentageChange: ReportsMapper.percentage(absolute.div(periodA).mul(100)),
      direction: absolute.greaterThan(0)
        ? 'INCREASE'
        : absolute.lessThan(0)
          ? 'DECREASE'
          : 'UNCHANGED',
    };
  }

  static metric(
    metric: ComparisonMetricName,
    periodA: Prisma.Decimal,
    periodB: Prisma.Decimal,
    valueKind: 'MONEY' | 'COUNT',
  ): ComparisonMetric {
    const change = ReportsMapper.change(periodA, periodB);
    const format = (value: Prisma.Decimal): string =>
      valueKind === 'MONEY' ? ReportsMapper.money(value) : value.toFixed(0);
    return {
      metric,
      valueKind,
      periodAValue: format(periodA),
      periodBValue: format(periodB),
      absoluteChange:
        valueKind === 'MONEY' ? change.absoluteChange : periodB.minus(periodA).toFixed(0),
      percentageChange: change.percentageChange,
      direction: change.direction,
    };
  }
}
