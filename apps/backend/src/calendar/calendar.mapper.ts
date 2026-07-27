import { ExpenseStatus } from '@prisma/client';

import { ExpenseMapper } from '../expenses/expense.mapper';
import type { ExpenseWithRelations } from '../expenses/expenses.types';
import type { CalendarExpenseEvent } from './calendar.types';

export class CalendarMapper {
  static toEvent(expense: ExpenseWithRelations, today: string): CalendarExpenseEvent {
    const mapped = ExpenseMapper.toResponse(expense);
    return {
      id: mapped.id,
      expenseId: mapped.id,
      title: mapped.description,
      amount: mapped.amount,
      expenseDate: mapped.expenseDate,
      expenseTime: mapped.expenseTime,
      allDay: mapped.expenseTime === null,
      status: mapped.status,
      isOverdue:
        mapped.status === ExpenseStatus.PLANNED &&
        mapped.expenseDate < today,
      merchant: mapped.merchant,
      category: {
        id: mapped.category.id,
        name: mapped.category.name,
        color: mapped.category.color,
        icon: mapped.category.icon,
      },
      labels: mapped.labels.map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color,
        icon: label.icon,
      })),
      paymentMethod: mapped.paymentMethod,
      generatedByRecurrence: mapped.generatedByRecurrence,
      recurrence: mapped.recurrence,
    };
  }
}
