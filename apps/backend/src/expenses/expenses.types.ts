import type {
  ExpenseStatus,
  PaymentMethod,
  Prisma,
  RecurrenceStatus,
} from '@prisma/client';

export type ExpenseWithRelations = Prisma.ExpenseGetPayload<{
  include: {
    category: true;
    labels: { include: { label: true } };
    recurrenceRule: { select: { id: true; name: true; status: true } };
  };
}>;

export type ExpenseWithReminderSummary = ExpenseWithRelations & {
  reminders?: Array<{ scheduledAt: Date }>;
};

export interface ExpenseCategoryResponse {
  id: string;
  name: string;
  color: string;
  icon: string;
  isActive: boolean;
}

export interface ExpenseLabelResponse {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  isActive: boolean;
}

export interface ExpenseResponse {
  id: string;
  description: string;
  amount: string;
  expenseDate: string;
  expenseTime: string | null;
  merchant: string | null;
  paymentMethod: PaymentMethod;
  notes: string | null;
  status: ExpenseStatus;
  generatedByRecurrence: boolean;
  occurrenceDate: string | null;
  recurrence: {
    id: string;
    name: string;
    status: RecurrenceStatus;
  } | null;
  nextReminderAt: string | null;
  activeReminderCount: number;
  category: ExpenseCategoryResponse;
  labels: ExpenseLabelResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ExpensePaginationMeta extends Record<string, unknown> {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ExpenseCsvResult {
  content: string;
  filename: string;
}

export interface ExpenseListSummary {
  totalResults: number;
  completed: number;
  planned: number;
  cancelled: number;
}
