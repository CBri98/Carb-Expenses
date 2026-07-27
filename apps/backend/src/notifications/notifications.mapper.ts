import type { ExpenseReminder } from '@prisma/client';

import { formatExpenseDate } from '../expenses/expense.utils';
import type {
  ExpenseReminderResponse,
  NotificationResponse,
  NotificationWithRelations,
} from './notifications.types';

export class NotificationsMapper {
  static reminder(reminder: ExpenseReminder): ExpenseReminderResponse {
    return {
      id: reminder.id,
      type: reminder.type,
      offsetMinutes: reminder.offsetMinutes,
      scheduledAt: reminder.scheduledAt.toISOString(),
      isActive: reminder.isActive,
      processedAt: reminder.processedAt?.toISOString() ?? null,
      cancelledAt: reminder.cancelledAt?.toISOString() ?? null,
      createdAt: reminder.createdAt.toISOString(),
      updatedAt: reminder.updatedAt.toISOString(),
    };
  }

  static notification(notification: NotificationWithRelations): NotificationResponse {
    const expense = notification.expense?.deletedAt ? null : notification.expense;
    return {
      id: notification.id,
      type: notification.type,
      status: notification.status,
      title: notification.title,
      message: notification.message,
      scheduledAt: notification.scheduledAt.toISOString(),
      readAt: notification.readAt?.toISOString() ?? null,
      archivedAt: notification.archivedAt?.toISOString() ?? null,
      createdAt: notification.createdAt.toISOString(),
      expense: expense
        ? {
            id: expense.id,
            description: expense.description,
            amount: expense.amount.toFixed(2),
            expenseDate: formatExpenseDate(expense.expenseDate),
            status: expense.status,
            category: {
              id: expense.category.id,
              name: expense.category.name,
              color: expense.category.color,
              icon: expense.category.icon,
            },
          }
        : null,
      reminder: notification.reminder
        ? NotificationsMapper.reminder(notification.reminder)
        : null,
    };
  }
}
