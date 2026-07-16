import type { ExpenseStatus, PaymentMethod } from './expense.models';

export type CalendarView = 'month' | 'week' | 'list';

export interface CalendarExpenseEvent {
  id: string;
  expenseId: string;
  title: string;
  amount: string;
  expenseDate: string;
  expenseTime: string | null;
  allDay: boolean;
  status: ExpenseStatus;
  isOverdue: boolean;
  merchant: string | null;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  labels: Array<{
    id: string;
    name: string;
    color: string;
    icon: string | null;
  }>;
  paymentMethod: PaymentMethod;
}

export interface CalendarFilters {
  status: ExpenseStatus[];
  categoryId: string;
  labelIds: string[];
  paymentMethod: PaymentMethod | '';
  search: string;
}

export interface CalendarState {
  view: CalendarView;
  date: string;
  filters: CalendarFilters;
}

export interface CalendarDateRange {
  start: string;
  end: string;
}

export interface CalendarDay {
  date: string;
  dayNumber: number;
  inCurrentMonth: boolean;
  isToday: boolean;
}

export interface CalendarEventsQuery extends CalendarDateRange {
  status?: ExpenseStatus[];
  categoryId?: string;
  labelIds?: string[];
  paymentMethod?: PaymentMethod;
  search?: string;
}

export const DEFAULT_CALENDAR_STATUSES: ExpenseStatus[] = ['PLANNED', 'COMPLETED'];
