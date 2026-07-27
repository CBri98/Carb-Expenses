import type { ExpenseListItem } from './expense.models';

export interface DashboardPeriod {
  month: number;
  year: number;
  label: string;
  isCurrentMonth: boolean;
}
export interface DashboardCategory { id: string; name: string; color: string; icon: string }
export interface DashboardTopCategory extends DashboardCategory { total: string; percentage: number }
export interface DashboardPlannedExpense {
  id: string;
  description: string;
  amount: string;
  expenseDate: string;
  daysUntilDue: number;
  category: DashboardCategory;
  generatedByRecurrence: boolean;
  recurrence: {
    id: string;
    name: string;
    status: import('./recurrence.models').RecurrenceStatus;
  } | null;
}
export type DashboardChangeDirection = 'INCREASE' | 'DECREASE' | 'UNCHANGED' | 'NOT_COMPARABLE';
export interface DashboardSummary {
  period: DashboardPeriod;
  totalSpent: string;
  previousPeriodTotal: string;
  absoluteChange: string;
  percentageChange: number | null;
  changeDirection: DashboardChangeDirection;
  expenseCount: number;
  dailyAverage: string;
  topCategory: DashboardTopCategory | null;
  plannedTotal: string;
  nextPlannedExpense: DashboardPlannedExpense | null;
}
export interface DailyTrendPoint { date: string; day: number; total: string; expenseCount: number }
export interface CategoryDistributionItem extends DashboardCategory {
  categoryId: string;
  total: string;
  expenseCount: number;
  percentage: number;
}
export interface MonthlyTrendPoint { month: number; year: number; label: string; total: string; expenseCount: number }
export interface RecentExpense extends ExpenseListItem {}
export interface UpcomingExpense extends ExpenseListItem { daysUntilDue: number }
export interface DashboardPeriodQuery { month: number; year: number }
export interface MonthlyTrendQuery extends DashboardPeriodQuery { months: number }
export interface DashboardData {
  summary: DashboardSummary;
  dailyTrend: DailyTrendPoint[];
  categoryDistribution: CategoryDistributionItem[];
  monthlyTrend: MonthlyTrendPoint[];
  recentExpenses: RecentExpense[];
  upcomingExpenses: UpcomingExpense[];
}
