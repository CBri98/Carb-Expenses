import { ExpenseStatus, type Prisma } from '@prisma/client';
import { ReminderDerivedStatus } from './dto/reminder.dto';
import type {
  ReminderAllowedActions,
  ReminderBulkReason,
  ReminderWithRelations,
} from './reminders.types';

export const UPCOMING_DAYS = 7;

export function validExpenseWhere(): Prisma.ExpenseWhereInput {
  return { deletedAt: null, status: ExpenseStatus.PLANNED };
}

export function derivedStatus(
  reminder: Pick<ReminderWithRelations, 'processedAt' | 'cancelledAt' | 'isActive' | 'scheduledAt' | 'expense'>,
  now: Date,
  upcomingDays = UPCOMING_DAYS,
): ReminderDerivedStatus {
  if (reminder.processedAt) return ReminderDerivedStatus.PROCESSED;
  if (!reminder.isActive || reminder.cancelledAt) return ReminderDerivedStatus.CANCELLED;
  if (reminder.expense.deletedAt || reminder.expense.status !== ExpenseStatus.PLANNED) {
    return ReminderDerivedStatus.INVALID;
  }
  if (reminder.scheduledAt <= now) return ReminderDerivedStatus.DUE;
  if (reminder.scheduledAt <= addDays(now, upcomingDays)) return ReminderDerivedStatus.UPCOMING;
  return ReminderDerivedStatus.ACTIVE;
}

export function allowedActions(
  reminder: ReminderWithRelations,
  now: Date,
): ReminderAllowedActions {
  const unprocessed = reminder.processedAt === null;
  const validExpense =
    reminder.expense.deletedAt === null && reminder.expense.status === ExpenseStatus.PLANNED;
  return {
    canEdit: unprocessed && validExpense,
    canCancel: unprocessed && reminder.isActive,
    canReactivate: unprocessed && validExpense && !reminder.isActive && reminder.scheduledAt > now,
    canDelete: unprocessed && reminder.notifications.length === 0 && reminder.source !== 'RECURRENCE',
  };
}

export function statusWhere(
  status: ReminderDerivedStatus | undefined,
  now: Date,
  upcomingDays = UPCOMING_DAYS,
): Prisma.ExpenseReminderWhereInput | undefined {
  const valid = { expense: { is: validExpenseWhere() } };
  const active = { isActive: true, processedAt: null, ...valid };
  switch (status) {
    case ReminderDerivedStatus.ACTIVE:
      return { ...active, scheduledAt: { gt: now } };
    case ReminderDerivedStatus.UPCOMING:
      return { ...active, scheduledAt: { gt: now, lte: addDays(now, upcomingDays) } };
    case ReminderDerivedStatus.DUE:
      return { ...active, scheduledAt: { lte: now } };
    case ReminderDerivedStatus.PROCESSED:
      return { processedAt: { not: null } };
    case ReminderDerivedStatus.CANCELLED:
      return { processedAt: null, OR: [{ isActive: false }, { cancelledAt: { not: null } }] };
    case ReminderDerivedStatus.INVALID:
      return {
        isActive: true,
        processedAt: null,
        expense: {
          is: {
            OR: [
              { deletedAt: { not: null } },
              { status: { not: ExpenseStatus.PLANNED } },
            ],
          },
        },
      };
    default:
      return undefined;
  }
}

export function addDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * 86_400_000);
}

export function bulkReason(error: unknown): ReminderBulkReason {
  const message = error instanceof Error ? error.message.toLocaleLowerCase('it-IT') : '';
  if (message.includes('non trovato')) return 'NOT_FOUND';
  if (message.includes('processat') || message.includes('elaborat')) return 'ALREADY_PROCESSED';
  if (message.includes('trascors') || message.includes('passato')) return 'PAST_SCHEDULE';
  if (message.includes('spesa')) return 'INVALID_EXPENSE';
  if (message.includes('notific')) return 'HAS_NOTIFICATION';
  if (message.includes('ricorren')) return 'RECURRENCE_MANAGED';
  if (message.includes('equivalent') || message.includes('duplicat')) return 'DUPLICATE';
  return 'NOT_ALLOWED';
}
