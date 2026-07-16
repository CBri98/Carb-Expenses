import type { ExpenseStatus, PaymentMethod } from '../models/expense.models';

const paymentLabels: Record<PaymentMethod, string> = {
  CASH: 'Contanti',
  DEBIT_CARD: 'Carta di debito',
  CREDIT_CARD: 'Carta di credito',
  BANK_TRANSFER: 'Bonifico',
  DIRECT_DEBIT: 'Addebito diretto',
  DIGITAL_WALLET: 'Portafoglio digitale',
  CHECK: 'Assegno',
  OTHER: 'Altro',
};

const statusLabels: Record<ExpenseStatus, string> = {
  COMPLETED: 'Completata',
  PLANNED: 'Pianificata',
  CANCELLED: 'Annullata',
};

export function formatEuroAmount(value: string): string {
  const normalized = value.replace(',', '.');
  const [integer = '0', decimals = '00'] = normalized.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${grouped},${decimals.padEnd(2, '0').slice(0, 2)}\u00a0€`;
}

export function normalizeAmount(value: string): string {
  return value.trim().replace(',', '.');
}

export function formatItalianDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

export function todayLocalDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function isFutureLocalDate(value: string, today = todayLocalDate()): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value > today;
}

export function paymentMethodLabel(value: PaymentMethod): string {
  return paymentLabels[value];
}

export function expenseStatusLabel(value: ExpenseStatus): string {
  return statusLabels[value];
}
