import { Prisma } from '@prisma/client';
import { ExpenseMapper } from '../expenses/expense.mapper';
import type { DashboardExpenseWithRelations, DashboardPlannedExpense, UpcomingExpense } from './dashboard.types';
import { daysBetween, isoDate } from './dashboard.utils';

export class DashboardMapper {
  static money(value: Prisma.Decimal | null | undefined): string {
    return (value ?? new Prisma.Decimal(0)).toFixed(2);
  }
  static percentage(value: Prisma.Decimal): number {
    return Math.round(value.toNumber() * 100) / 100;
  }
  static plannedExpense(expense: DashboardExpenseWithRelations, today: Date): DashboardPlannedExpense {
    return {
      id: expense.id,
      description: expense.description,
      amount: expense.amount.toFixed(2),
      expenseDate: isoDate(expense.expenseDate),
      daysUntilDue: daysBetween(today, expense.expenseDate),
      category: { id: expense.category.id, name: expense.category.name, color: expense.category.color, icon: expense.category.icon },
    };
  }
  static upcomingExpense(expense: DashboardExpenseWithRelations, today: Date): UpcomingExpense {
    return { ...ExpenseMapper.toResponse(expense), daysUntilDue: daysBetween(today, expense.expenseDate) };
  }
}
