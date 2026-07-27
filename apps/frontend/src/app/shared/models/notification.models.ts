import type { ExpenseStatus, PaginationMeta } from './expense.models';

export type ReminderType =
  | 'SAME_DAY'
  | 'ONE_DAY_BEFORE'
  | 'THREE_DAYS_BEFORE'
  | 'SEVEN_DAYS_BEFORE'
  | 'CUSTOM';

export type NotificationType =
  | 'EXPENSE_REMINDER'
  | 'EXPENSE_DUE_TODAY'
  | 'EXPENSE_OVERDUE';

export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

export interface ExpenseReminder {
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

export interface ReminderDraft {
  type: ReminderType;
  scheduledAt?: string;
}

export interface ReminderPresetOption {
  type: Exclude<ReminderType, 'CUSTOM'>;
  label: string;
  help: string;
}

export const REMINDER_PRESETS: readonly ReminderPresetOption[] = [
  { type: 'SAME_DAY', label: 'Il giorno stesso', help: 'All’ora della spesa o alle 09:00.' },
  { type: 'ONE_DAY_BEFORE', label: '1 giorno prima', help: '24 ore prima della scadenza.' },
  { type: 'THREE_DAYS_BEFORE', label: '3 giorni prima', help: '72 ore prima della scadenza.' },
  { type: 'SEVEN_DAYS_BEFORE', label: '7 giorni prima', help: 'Una settimana prima della scadenza.' },
];

export interface CreateExpenseReminderRequest {
  type: ReminderType;
  scheduledAt?: string;
}

export interface UpdateExpenseReminderRequest {
  type?: ReminderType;
  scheduledAt?: string;
  isActive?: boolean;
}

export interface NotificationExpense {
  id: string;
  description: string;
  amount: string;
  expenseDate: string;
  status: ExpenseStatus;
  category: { id: string; name: string; color: string; icon: string };
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  scheduledAt: string;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  expense: NotificationExpense | null;
  reminder: ExpenseReminder | null;
}

export interface NotificationQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: NotificationStatus;
  type?: NotificationType;
  expenseId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedNotificationResponse {
  items: AppNotification[];
  meta: PaginationMeta;
}

export interface UnreadNotificationCount {
  count: number;
}

export interface NotificationFilters {
  search: string;
  status: '' | NotificationStatus;
  type: '' | NotificationType;
  expenseId: string;
  dateFrom: string;
  dateTo: string;
}

export const NOTIFICATION_TYPES: ReadonlyArray<{ value: NotificationType; label: string; icon: string }> = [
  { value: 'EXPENSE_REMINDER', label: 'Promemoria anticipato', icon: 'bi-alarm' },
  { value: 'EXPENSE_DUE_TODAY', label: 'Scadenza di oggi', icon: 'bi-calendar2-check' },
  { value: 'EXPENSE_OVERDUE', label: 'Spesa scaduta', icon: 'bi-exclamation-triangle' },
];

export const NOTIFICATION_STATUSES: ReadonlyArray<{ value: NotificationStatus | ''; label: string; icon: string }> = [
  { value: '', label: 'Tutte non archiviate', icon: 'bi-inbox' },
  { value: 'UNREAD', label: 'Non lette', icon: 'bi-envelope' },
  { value: 'READ', label: 'Lette', icon: 'bi-envelope-open' },
  { value: 'ARCHIVED', label: 'Archiviate', icon: 'bi-archive' },
];
