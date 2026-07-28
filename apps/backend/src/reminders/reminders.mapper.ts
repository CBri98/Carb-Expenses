import { formatExpenseDate, formatExpenseTime } from '../expenses/expense.utils';
import type { ReminderResponse, ReminderWithRelations } from './reminders.types';
import { allowedActions, derivedStatus } from './reminders.utils';

export class RemindersMapper {
  static toResponse(reminder: ReminderWithRelations, now = new Date()): ReminderResponse {
    const notification = reminder.notifications[0] ?? null;
    return {
      id: reminder.id,
      type: reminder.type,
      source: reminder.source,
      status: derivedStatus(reminder, now),
      offsetMinutes: reminder.offsetMinutes,
      scheduledAt: reminder.scheduledAt.toISOString(),
      isActive: reminder.isActive,
      processedAt: reminder.processedAt?.toISOString() ?? null,
      cancelledAt: reminder.cancelledAt?.toISOString() ?? null,
      createdAt: reminder.createdAt.toISOString(),
      updatedAt: reminder.updatedAt.toISOString(),
      expense: {
        id: reminder.expense.id,
        description: reminder.expense.description,
        amount: reminder.expense.amount.toFixed(2),
        expenseDate: formatExpenseDate(reminder.expense.expenseDate),
        expenseTime: formatExpenseTime(reminder.expense.expenseTime),
        merchant: reminder.expense.merchant,
        status: reminder.expense.status,
        deletedAt: reminder.expense.deletedAt?.toISOString() ?? null,
        category: {
          id: reminder.expense.category.id,
          name: reminder.expense.category.name,
          color: reminder.expense.category.color,
          icon: reminder.expense.category.icon,
        },
        labels: reminder.expense.labels.map(({ label }) => ({
          id: label.id,
          name: label.name,
          color: label.color,
          icon: label.icon,
        })),
        recurrence: reminder.expense.recurrenceRule
          ? {
              id: reminder.expense.recurrenceRule.id,
              name: reminder.expense.recurrenceRule.name,
              status: reminder.expense.recurrenceRule.status,
            }
          : null,
      },
      notification: notification
        ? {
            id: notification.id,
            status: notification.status,
            title: notification.title,
            createdAt: notification.createdAt.toISOString(),
          }
        : null,
      allowedActions: allowedActions(reminder, now),
    };
  }
}
