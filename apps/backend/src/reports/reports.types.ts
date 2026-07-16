import type { PaymentMethod } from '@prisma/client';

export type ComparisonDirection =
  | 'INCREASE'
  | 'DECREASE'
  | 'UNCHANGED'
  | 'NOT_COMPARABLE';

export interface ReportPeriod {
  month: number;
  year: number;
  label: string;
  shortLabel: string;
  daysInMonth: number;
  isCurrentMonth: boolean;
}
export interface ReportCategory { id: string; name: string; color: string; icon: string }
export interface MonthlyReportSummary {
  completedTotal: string;
  plannedTotal: string;
  completedCount: number;
  plannedCount: number;
  cancelledCount: number;
  dailyAverage: string;
  transactionAverage: string;
}
export interface HighestSpendingDay { date: string; total: string; expenseCount: number }
export interface HighestExpense {
  id: string;
  description: string;
  amount: string;
  expenseDate: string;
  category: ReportCategory;
}
export interface CategoryReportItem extends ReportCategory {
  categoryId: string;
  total: string;
  expenseCount: number;
  averageAmount: string;
  percentage: number;
}
export interface DailyReportPoint {
  date: string;
  day: number;
  completedTotal: string;
  plannedTotal: string;
  completedCount: number;
  plannedCount: number;
}
export interface PaymentMethodReportItem {
  paymentMethod: PaymentMethod;
  total: string;
  expenseCount: number;
  percentage: number;
}
export interface PreviousMonthComparison {
  previousTotal: string;
  absoluteChange: string;
  percentageChange: number | null;
  direction: ComparisonDirection;
}
export interface MonthlyReport {
  period: ReportPeriod;
  summary: MonthlyReportSummary;
  highestSpendingDay: HighestSpendingDay | null;
  highestExpense: HighestExpense | null;
  topCategory: CategoryReportItem | null;
  categoryDistribution: CategoryReportItem[];
  dailyTrend: DailyReportPoint[];
  paymentMethodBreakdown: PaymentMethodReportItem[];
  previousMonthComparison: PreviousMonthComparison;
}
export type ComparisonMetricName =
  | 'COMPLETED_TOTAL'
  | 'PLANNED_TOTAL'
  | 'COMPLETED_COUNT'
  | 'PLANNED_COUNT'
  | 'DAILY_AVERAGE'
  | 'TRANSACTION_AVERAGE'
  | 'HIGHEST_EXPENSE'
  | 'CATEGORY_COUNT';
export interface ComparisonMetric {
  metric: ComparisonMetricName;
  valueKind: 'MONEY' | 'COUNT';
  periodAValue: string;
  periodBValue: string;
  absoluteChange: string;
  percentageChange: number | null;
  direction: ComparisonDirection;
}
export interface CategoryComparisonItem extends ReportCategory {
  categoryId: string;
  periodATotal: string;
  periodBTotal: string;
  periodACount: number;
  periodBCount: number;
  absoluteChange: string;
  percentageChange: number | null;
  direction: ComparisonDirection;
}
export interface DailyComparisonPoint {
  day: number;
  periodADate: string | null;
  periodBDate: string | null;
  periodATotal: string | null;
  periodBTotal: string | null;
  periodACount: number | null;
  periodBCount: number | null;
}
export interface PaymentMethodComparisonItem {
  paymentMethod: PaymentMethod;
  periodATotal: string;
  periodBTotal: string;
  periodACount: number;
  periodBCount: number;
  absoluteChange: string;
  percentageChange: number | null;
  direction: ComparisonDirection;
}
export interface MonthComparison {
  periodA: ReportPeriod;
  periodB: ReportPeriod;
  samePeriod: boolean;
  metrics: ComparisonMetric[];
  categories: CategoryComparisonItem[];
  daily: DailyComparisonPoint[];
  paymentMethods: PaymentMethodComparisonItem[];
}
