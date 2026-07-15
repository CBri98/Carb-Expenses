import { formatExpenseDate, formatExpenseTime } from './expense.utils';
import type { ExpenseResponse, ExpenseWithRelations } from './expenses.types';

export class ExpenseMapper {
  static toResponse(expense: ExpenseWithRelations): ExpenseResponse {
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
