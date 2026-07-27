import type {
  ExpenseListItem,
  ExpenseStatus,
  PaginationMeta,
  PaymentMethod,
} from './expense.models';

export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
export type RecurrenceStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type RecurrenceUpdateScope = 'RULE_ONLY' | 'RULE_AND_FUTURE_PLANNED_EXPENSES';
export type RecurrenceReminderType =
  | 'SAME_DAY'
  | 'ONE_DAY_BEFORE'
  | 'THREE_DAYS_BEFORE'
  | 'SEVEN_DAYS_BEFORE';

export const RECURRENCE_FREQUENCIES: ReadonlyArray<{
  value: RecurrenceFrequency;
  label: string;
  singular: string;
  plural: string;
  icon: string;
}> = [
  { value: 'DAILY', label: 'Giornaliera', singular: 'giorno', plural: 'giorni', icon: 'bi-sun' },
  { value: 'WEEKLY', label: 'Settimanale', singular: 'settimana', plural: 'settimane', icon: 'bi-calendar-week' },
  { value: 'MONTHLY', label: 'Mensile', singular: 'mese', plural: 'mesi', icon: 'bi-calendar-month' },
  { value: 'YEARLY', label: 'Annuale', singular: 'anno', plural: 'anni', icon: 'bi-calendar-range' },
];

export const RECURRENCE_STATUSES: ReadonlyArray<{
  value: RecurrenceStatus;
  label: string;
  icon: string;
}> = [
  { value: 'ACTIVE', label: 'Attiva', icon: 'bi-play-circle' },
  { value: 'PAUSED', label: 'In pausa', icon: 'bi-pause-circle' },
  { value: 'COMPLETED', label: 'Completata', icon: 'bi-check-circle' },
  { value: 'CANCELLED', label: 'Terminata', icon: 'bi-stop-circle' },
];

export const RECURRENCE_REMINDER_OPTIONS: ReadonlyArray<{
  type: RecurrenceReminderType;
  label: string;
}> = [
  { type: 'SAME_DAY', label: 'Il giorno stesso' },
  { type: 'ONE_DAY_BEFORE', label: '1 giorno prima' },
  { type: 'THREE_DAYS_BEFORE', label: '3 giorni prima' },
  { type: 'SEVEN_DAYS_BEFORE', label: '7 giorni prima' },
];

export interface RecurrenceReminderTemplate {
  id: string;
  type: RecurrenceReminderType;
  offsetMinutes: number;
  reminderTime: string | null;
}

export interface RecurrenceException {
  id: string;
  occurrenceDate: string;
  reason: string | null;
  createdAt: string;
}

export interface RecurrenceRule {
  id: string;
  name: string;
  description: string;
  amount: string;
  merchant: string | null;
  paymentMethod: PaymentMethod;
  notes: string | null;
  frequency: RecurrenceFrequency;
  interval: number;
  status: RecurrenceStatus;
  startDate: string;
  endDate: string | null;
  nextOccurrenceDate: string | null;
  lastGeneratedDate: string | null;
  maxOccurrences: number | null;
  generatedCount: number;
  expenseTime: string | null;
  generateDaysAhead: number;
  pausedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
    isActive: boolean;
  };
  labels: Array<{
    id: string;
    name: string;
    color: string;
    icon: string | null;
    isActive: boolean;
  }>;
  reminderTemplates: RecurrenceReminderTemplate[];
  exceptions: RecurrenceException[];
  expenseCount: number;
  previewDates?: string[];
}

export interface RecurrenceSummary {
  activeCount: number;
  pausedCount: number;
  upcomingOccurrences: number;
  upcomingTotal: string;
  horizonDays: number;
}

export interface RecurrenceQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: RecurrenceStatus;
  frequency?: RecurrenceFrequency;
  categoryId?: string;
  paymentMethod?: PaymentMethod;
  sortBy?: 'nextOccurrenceDate' | 'name' | 'amount' | 'createdAt' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
}

export interface RecurrenceReminderTemplateRequest {
  type: RecurrenceReminderType;
  reminderTime?: string | null;
}

export interface CreateRecurrenceRequest {
  name: string;
  description: string;
  amount: string;
  categoryId: string;
  labelIds: string[];
  merchant?: string | null;
  paymentMethod: PaymentMethod;
  notes?: string | null;
  frequency: RecurrenceFrequency;
  interval: number;
  startDate: string;
  endDate?: string | null;
  maxOccurrences?: number | null;
  expenseTime?: string | null;
  generateDaysAhead: number;
  reminderTemplates: RecurrenceReminderTemplateRequest[];
}

export interface UpdateRecurrenceRequest extends Partial<CreateRecurrenceRequest> {
  updateScope: RecurrenceUpdateScope;
}

export interface RecurrencePreviewRequest {
  frequency: RecurrenceFrequency;
  interval: number;
  startDate: string;
  endDate?: string | null;
  maxOccurrences?: number | null;
  limit?: number;
}

export interface RecurrencePreviewResponse {
  dates: string[];
}

export interface RecurrenceExpensesQuery {
  page?: number;
  pageSize?: number;
  status?: ExpenseStatus;
  dateFrom?: string;
  dateTo?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PaginatedRecurrences {
  items: RecurrenceRule[];
  meta: PaginationMeta;
}

export interface PaginatedRecurrenceExpenses {
  items: ExpenseListItem[];
  meta: PaginationMeta;
}

export interface RecurrenceFormValue {
  name: string;
  amount: string;
  categoryId: string | null;
  labelIds: string[];
  merchant: string;
  paymentMethod: PaymentMethod;
  notes: string;
  frequency: RecurrenceFrequency;
  interval: number;
  startDate: string;
  endDate: string;
  maxOccurrences: number | null;
  expenseTime: string;
  generateDaysAhead: number;
  reminderTypes: RecurrenceReminderType[];
  reminderTime: string;
}

export interface RecurrenceFormSubmission {
  payload: CreateRecurrenceRequest;
  updateScope: RecurrenceUpdateScope;
}
