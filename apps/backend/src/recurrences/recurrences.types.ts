import type {
  PaymentMethod,
  RecurrenceFrequency,
  RecurrenceStatus,
  ReminderType,
  Prisma,
} from '@prisma/client';

import type { ExpenseResponse } from '../expenses/expenses.types';

export type RecurrenceWithRelations = Prisma.RecurrenceRuleGetPayload<{
  include: {
    category: true;
    labels: { include: { label: true } };
    reminderTemplates: true;
    exceptions: true;
    _count: { select: { expenses: true } };
  };
}>;

export interface RecurrenceReminderTemplateResponse {
  id: string;
  type: ReminderType;
  offsetMinutes: number;
  reminderTime: string | null;
}

export interface RecurrenceExceptionResponse {
  id: string;
  occurrenceDate: string;
  reason: string | null;
  createdAt: string;
}

export interface RecurrenceResponse {
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
  reminderTemplates: RecurrenceReminderTemplateResponse[];
  exceptions: RecurrenceExceptionResponse[];
  expenseCount: number;
  previewDates?: string[];
}

export interface RecurrencePaginationMeta extends Record<string, unknown> {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface RecurrenceSummary {
  activeCount: number;
  pausedCount: number;
  upcomingOccurrences: number;
  upcomingTotal: string;
  horizonDays: number;
}

export interface RecurrenceGenerationResult {
  processedRules: number;
  generatedExpenses: number;
  completedRules: number;
  skippedExisting: number;
  skippedExceptions: number;
  errors: number;
}

export interface RecurrenceExpensesResult {
  data: ExpenseResponse[];
  meta: RecurrencePaginationMeta;
}
