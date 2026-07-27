import type {
  NotificationStatus,
  NotificationType,
  Prisma,
  ReminderType,
} from '@prisma/client';

export const notificationInclude = {
  expense: { include: { category: true } },
  reminder: true,
} satisfies Prisma.NotificationInclude;

export type NotificationWithRelations = Prisma.NotificationGetPayload<{
  include: typeof notificationInclude;
}>;

export interface ExpenseReminderResponse {
  id: string;
  type: ReminderType;
  offsetMinutes: number | null;
  scheduledAt: string;
  isActive: boolean;
  processedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  scheduledAt: string;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  expense: {
    id: string;
    description: string;
    amount: string;
    expenseDate: string;
    status: string;
    category: { id: string; name: string; color: string; icon: string };
  } | null;
  reminder: ExpenseReminderResponse | null;
}

export interface NotificationPaginationMeta extends Record<string, unknown> {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface SchedulerCycleResult {
  processedReminders: number;
  generatedNotifications: number;
  generatedDueToday: number;
  generatedOverdue: number;
  errors: number;
}
