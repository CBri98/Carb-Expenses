export type ExpenseStatus = 'COMPLETED' | 'PLANNED' | 'CANCELLED';
export type ExpenseRecurrenceMode = 'ALL' | 'EXCLUDE' | 'ONLY';
export type PaymentMethod =
  | 'CASH'
  | 'DEBIT_CARD'
  | 'CREDIT_CARD'
  | 'BANK_TRANSFER'
  | 'DIRECT_DEBIT'
  | 'DIGITAL_WALLET'
  | 'CHECK'
  | 'OTHER';

export const EXPENSE_STATUSES: ReadonlyArray<{
  value: ExpenseStatus;
  label: string;
  icon: string;
}> = [
  { value: 'COMPLETED', label: 'Completata', icon: 'bi-check-circle' },
  { value: 'PLANNED', label: 'Pianificata', icon: 'bi-clock-history' },
  { value: 'CANCELLED', label: 'Annullata', icon: 'bi-x-circle' },
];

export const PAYMENT_METHODS: ReadonlyArray<{
  value: PaymentMethod;
  label: string;
  icon: string;
}> = [
  { value: 'CASH', label: 'Contanti', icon: 'bi-cash-stack' },
  { value: 'DEBIT_CARD', label: 'Carta di debito', icon: 'bi-credit-card-2-front' },
  { value: 'CREDIT_CARD', label: 'Carta di credito', icon: 'bi-credit-card' },
  { value: 'BANK_TRANSFER', label: 'Bonifico', icon: 'bi-bank' },
  { value: 'DIRECT_DEBIT', label: 'Addebito diretto', icon: 'bi-arrow-repeat' },
  { value: 'DIGITAL_WALLET', label: 'Portafoglio digitale', icon: 'bi-wallet2' },
  { value: 'CHECK', label: 'Assegno', icon: 'bi-receipt' },
  { value: 'OTHER', label: 'Altro', icon: 'bi-three-dots' },
];

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  isActive: boolean;
}

export interface ExpenseLabel {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  isActive: boolean;
}

interface ExpenseBase {
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
    status: import('./recurrence.models').RecurrenceStatus;
  } | null;
  nextReminderAt: string | null;
  activeReminderCount: number;
  category: ExpenseCategory;
  labels: ExpenseLabel[];
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseListItem extends ExpenseBase {}
export interface ExpenseDetail extends ExpenseBase {}
export interface Expense extends ExpenseBase {}

export interface CreateExpenseRequest {
  description: string;
  amount: string;
  expenseDate: string;
  expenseTime?: string | null;
  categoryId: string;
  labelIds?: string[];
  paymentMethod: PaymentMethod;
  merchant?: string | null;
  notes?: string | null;
  status: ExpenseStatus;
}

export interface UpdateExpenseRequest {
  description?: string;
  amount?: string;
  expenseDate?: string;
  expenseTime?: string | null;
  categoryId?: string;
  labelIds?: string[];
  paymentMethod?: PaymentMethod;
  merchant?: string | null;
  notes?: string | null;
  status?: ExpenseStatus;
}

export interface DuplicateExpenseRequest {
  expenseDate?: string;
}

export interface ExpenseQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  month?: number;
  year?: number;
  categoryId?: string;
  categoryIds?: string[];
  labelIds?: string[];
  status?: ExpenseStatus;
  statuses?: ExpenseStatus[];
  paymentMethod?: PaymentMethod;
  paymentMethods?: PaymentMethod[];
  recurrenceMode?: ExpenseRecurrenceMode;
  minAmount?: string;
  maxAmount?: string;
  includeFuture?: boolean;
  sortBy?: 'expenseDate' | 'amount' | 'description' | 'createdAt' | 'updatedAt';
  sortDirection?: 'asc' | 'desc';
}

export interface ExpenseFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  month: string;
  year: string;
  categoryIds: string[];
  labelIds: string[];
  statuses: ExpenseStatus[];
  paymentMethods: PaymentMethod[];
  recurrenceMode: ExpenseRecurrenceMode;
  minAmount: string;
  maxAmount: string;
  pageSize: string;
  sortBy: ExpenseQueryParams['sortBy'];
  sortDirection: ExpenseQueryParams['sortDirection'];
}

export interface ExpenseFormValue {
  description: string;
  amount: string;
  expenseDate: string;
  expenseTime: string;
  categoryId: string;
  labelIds: string[];
  paymentMethod: PaymentMethod;
  merchant: string;
  notes: string;
  status: ExpenseStatus;
}

export interface ExpenseFormSubmission {
  expense: CreateExpenseRequest;
  reminders: import('./notification.models').ReminderDraft[];
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedExpenseResponse {
  items: ExpenseListItem[];
  meta: PaginationMeta;
}

export interface ExpenseExportResult {
  blob: Blob;
  filename: string;
}

export interface ExpenseListSummary {
  totalResults: number;
  completed: number;
  planned: number;
  cancelled: number;
}
