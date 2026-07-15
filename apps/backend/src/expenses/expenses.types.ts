import type { ExpenseStatus, PaymentMethod, Prisma } from '@prisma/client';

export type ExpenseWithRelations = Prisma.ExpenseGetPayload<{
  include: {
    category: true;
    labels: { include: { label: true } };
  };
}>;

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
