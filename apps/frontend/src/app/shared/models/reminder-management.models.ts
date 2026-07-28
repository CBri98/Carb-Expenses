import type { Category } from './catalog.models';
import type { ExpenseStatus, PaginationMeta } from './expense.models';
import type { ReminderDraft, ReminderType } from './notification.models';

export type ReminderStatus = 'ACTIVE' | 'UPCOMING' | 'DUE' | 'PROCESSED' | 'CANCELLED' | 'INVALID';
export type ReminderSource = 'MANUAL' | 'RECURRENCE' | 'SYSTEM';
export type ReminderSort = 'scheduledAt' | 'createdAt' | 'updatedAt' | 'expenseDate' | 'expenseDescription' | 'status';

export interface ManagedReminder {
  id: string;
  type: ReminderType;
  source: ReminderSource;
  status: ReminderStatus;
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
    category: Pick<Category, 'id' | 'name' | 'color' | 'icon'>;
    labels: Array<{ id: string; name: string; color: string; icon: string | null }>;
    recurrence: { id: string; name: string; status: string } | null;
  };
  notification: { id: string; status: string; title: string; createdAt: string } | null;
  allowedActions: {
    canEdit: boolean;
    canCancel: boolean;
    canReactivate: boolean;
    canDelete: boolean;
  };
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

export interface ReminderQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ReminderStatus;
  type?: ReminderType;
  source?: ReminderSource;
  expenseStatus?: ExpenseStatus;
  categoryId?: string;
  recurrenceRuleId?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
  expenseDateFrom?: string;
  expenseDateTo?: string;
  sortBy?: ReminderSort;
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedReminders {
  items: ManagedReminder[];
  meta: PaginationMeta;
}

export interface ReminderBulkResult {
  requestedCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: Array<{ id: string; reason: string }>;
}

export const REMINDER_STATUSES: ReadonlyArray<{ value: ReminderStatus; label: string; icon: string }> = [
  { value: 'ACTIVE', label: 'Attivi', icon: 'bi-play-circle' },
  { value: 'UPCOMING', label: 'Entro 7 giorni', icon: 'bi-calendar2-week' },
  { value: 'DUE', label: 'Da elaborare', icon: 'bi-exclamation-circle' },
  { value: 'PROCESSED', label: 'Processati', icon: 'bi-check2-circle' },
  { value: 'CANCELLED', label: 'Annullati', icon: 'bi-x-circle' },
  { value: 'INVALID', label: 'Non validi', icon: 'bi-exclamation-triangle' },
];

export const REMINDER_SOURCES: ReadonlyArray<{ value: ReminderSource; label: string; icon: string }> = [
  { value: 'MANUAL', label: 'Manuale', icon: 'bi-person' },
  { value: 'RECURRENCE', label: 'Ricorrenza', icon: 'bi-arrow-repeat' },
  { value: 'SYSTEM', label: 'Sistema', icon: 'bi-gear' },
];

export const REMINDER_TYPES: ReadonlyArray<{ value: ReminderType; label: string; icon: string }> = [
  { value: 'SAME_DAY', label: 'Il giorno stesso', icon: 'bi-calendar-check' },
  { value: 'ONE_DAY_BEFORE', label: '1 giorno prima', icon: 'bi-calendar-minus' },
  { value: 'THREE_DAYS_BEFORE', label: '3 giorni prima', icon: 'bi-calendar2-week' },
  { value: 'SEVEN_DAYS_BEFORE', label: '7 giorni prima', icon: 'bi-calendar3' },
  { value: 'CUSTOM', label: 'Personalizzato', icon: 'bi-sliders' },
];

export type ReminderUpdateRequest = ReminderDraft;
