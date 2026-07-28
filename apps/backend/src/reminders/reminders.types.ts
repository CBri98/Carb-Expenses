import type { ExpenseStatus, Prisma, ReminderSource, ReminderType } from '@prisma/client';
import type { ReminderDerivedStatus } from './dto/reminder.dto';

export const reminderInclude = {
  expense: {
    include: {
      category: true,
      labels: { include: { label: true } },
      recurrenceRule: { select: { id: true, name: true, status: true, deletedAt: true } },
    },
  },
  notifications: { orderBy: { createdAt: 'desc' as const }, take: 1 },
} satisfies Prisma.ExpenseReminderInclude;

export type ReminderWithRelations = Prisma.ExpenseReminderGetPayload<{
  include: typeof reminderInclude;
}>;

export interface ReminderAllowedActions {
  canEdit: boolean;
  canCancel: boolean;
  canReactivate: boolean;
  canDelete: boolean;
}

export interface ReminderResponse {
  id: string;
  type: ReminderType;
  source: ReminderSource;
  status: ReminderDerivedStatus;
  offsetMinutes: number | null;
  scheduledAt: string;
  isActive: boolean;
  processedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  expense: {
    id: string;
    description: string;
    amount: string;
    expenseDate: string;
    expenseTime: string | null;
    merchant: string | null;
    status: ExpenseStatus;
    deletedAt: string | null;
    category: { id: string; name: string; color: string; icon: string };
    labels: Array<{ id: string; name: string; color: string; icon: string | null }>;
    recurrence: { id: string; name: string; status: string } | null;
  };
  notification: { id: string; status: string; title: string; createdAt: string } | null;
  allowedActions: ReminderAllowedActions;
}

export interface ReminderSummary {
  activeCount: number;
  upcomingCount: number;
  dueCount: number;
  processedCount: number;
  cancelledCount: number;
  nextReminder: {
    id: string;
    scheduledAt: string;
    expenseId: string;
    expenseDescription: string;
  } | null;
}

export type ReminderBulkReason =
  | 'NOT_FOUND'
  | 'ALREADY_PROCESSED'
  | 'PAST_SCHEDULE'
  | 'INVALID_EXPENSE'
  | 'HAS_NOTIFICATION'
  | 'RECURRENCE_MANAGED'
  | 'DUPLICATE'
  | 'NOT_ALLOWED';

export interface ReminderBulkResult {
  requestedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: Array<{ id: string; reason: ReminderBulkReason }>;
}
