import type { ExpenseStatus, PaymentMethod } from '@prisma/client';

export interface CalendarEventCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
}
export interface CalendarEventLabel {
  id: string;
  name: string;
  color: string;
  icon: string | null;
}
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
  category: CalendarEventCategory;
  labels: CalendarEventLabel[];
  paymentMethod: PaymentMethod;
}
