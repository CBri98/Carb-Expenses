import type { Prisma } from '@prisma/client';
import type { ExpenseResponse } from '../expenses/expenses.types';

export interface DashboardCategory { id: string; name: string; color: string; icon: string }
export interface DashboardTopCategory extends DashboardCategory { total: string; percentage: number }
export interface DashboardPlannedExpense {
  id: string; description: string; amount: string; expenseDate: string;
  daysUntilDue: number; category: DashboardCategory;
}
export interface DashboardSummary {
  period: { month: number; year: number; label: string; isCurrentMonth: boolean };
  totalSpent: string; previousPeriodTotal: string; absoluteChange: string;
  percentageChange: number | null;
  changeDirection: 'INCREASE' | 'DECREASE' | 'UNCHANGED' | 'NOT_COMPARABLE';
  expenseCount: number; dailyAverage: string;
  topCategory: DashboardTopCategory | null; plannedTotal: string;
  nextPlannedExpense: DashboardPlannedExpense | null;
}
export interface DailyTrendPoint { date: string; day: number; total: string; expenseCount: number }
export interface CategoryDistributionItem extends DashboardCategory { categoryId: string; total: string; expenseCount: number; percentage: number }
export interface MonthlyTrendPoint { month: number; year: number; label: string; total: string; expenseCount: number }
export interface UpcomingExpense extends ExpenseResponse { daysUntilDue: number }
export type DashboardExpenseWithRelations = Prisma.ExpenseGetPayload<{
  include: { category: true; labels: { include: { label: true } } };
}>;
