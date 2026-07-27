import { formatExpenseDate, formatExpenseTime } from './expense.utils';
import type { ExpenseResponse, ExpenseWithReminderSummary } from './expenses.types';

export class ExpenseMapper {
  static toResponse(expense: ExpenseWithReminderSummary): ExpenseResponse {
    const reminders = expense.reminders ?? [];
    return {
      id: expense.id,
      description: expense.description,
      amount: expense.amount.toFixed(2),
      expenseDate: formatExpenseDate(expense.expenseDate),
      expenseTime: formatExpenseTime(expense.expenseTime),
      merchant: expense.merchant,
      paymentMethod: expense.paymentMethod,
      notes: expense.notes,
      status: expense.status,
      generatedByRecurrence: expense.generatedByRecurrence,
      occurrenceDate: expense.occurrenceDate
        ? formatExpenseDate(expense.occurrenceDate)
        : null,
      recurrence: expense.recurrenceRule
        ? {
            id: expense.recurrenceRule.id,
            name: expense.recurrenceRule.name,
            status: expense.recurrenceRule.status,
          }
        : null,
      nextReminderAt: reminders[0]?.scheduledAt.toISOString() ?? null,
      activeReminderCount: reminders.length,
      category: {
        id: expense.category.id,
        name: expense.category.name,
        color: expense.category.color,
        icon: expense.category.icon,
        isActive: expense.category.isActive,
      },
      labels: expense.labels.map(({ label }) => ({
        id: label.id,
        name: label.name,
        color: label.color,
        icon: label.icon,
        isActive: label.isActive,
      })),
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
    };
  }
}
