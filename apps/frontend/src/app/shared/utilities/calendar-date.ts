import type {
  CalendarDateRange,
  CalendarDay,
  CalendarFilters,
  CalendarState,
  CalendarView,
} from '../models/calendar.models';
import type { ExpenseStatus, PaymentMethod } from '../models/expense.models';

const DAY_MS = 86_400_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VIEWS: CalendarView[] = ['month', 'week', 'list'];
const STATUSES: ExpenseStatus[] = ['COMPLETED', 'PLANNED', 'CANCELLED'];
const PAYMENTS: PaymentMethod[] = [
  'CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'BANK_TRANSFER',
  'DIRECT_DEBIT', 'DIGITAL_WALLET', 'CHECK', 'OTHER',
];

export function todayRomeDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (name: Intl.DateTimeFormatPartTypes): string =>
    parts.find((item) => item.type === name)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function validCalendarDate(value: string | null | undefined): value is string {
  if (!value || !DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

export function addCalendarDays(value: string, days: number): string {
  const date = parseCalendarDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return isoCalendarDate(date);
}

export function shiftCalendarPeriod(
  value: string,
  view: CalendarView,
  direction: -1 | 1,
): string {
  if (view === 'week') return addCalendarDays(value, direction * 7);
  const date = parseCalendarDate(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + direction);
  const finalDay = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    0,
  )).getUTCDate();
  date.setUTCDate(Math.min(day, finalDay));
  return isoCalendarDate(date);
}

export function calendarRange(view: CalendarView, anchor: string): CalendarDateRange {
  const date = parseCalendarDate(anchor);
  if (view === 'week') {
    const start = startOfWeek(date);
    return { start: isoCalendarDate(start), end: isoCalendarDate(addUtcDays(start, 7)) };
  }
  const monthStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  if (view === 'list') {
    return { start: isoCalendarDate(monthStart), end: isoCalendarDate(monthEnd) };
  }
  const gridStart = startOfWeek(monthStart);
  const lastDay = addUtcDays(monthEnd, -1);
  const mondayIndex = (lastDay.getUTCDay() + 6) % 7;
  const gridEnd = addUtcDays(lastDay, 7 - mondayIndex);
  return { start: isoCalendarDate(gridStart), end: isoCalendarDate(gridEnd) };
}

export function calendarDays(range: CalendarDateRange, anchor: string, today: string): CalendarDay[] {
  const days: CalendarDay[] = [];
  const anchorMonth = anchor.slice(0, 7);
  for (let date = range.start; date < range.end; date = addCalendarDays(date, 1)) {
    days.push({
      date,
      dayNumber: Number(date.slice(8, 10)),
      inCurrentMonth: date.startsWith(anchorMonth),
      isToday: date === today,
    });
  }
  return days;
}

export function calendarHeading(view: CalendarView, anchor: string): string {
  if (view !== 'week') {
    return capitalize(new Intl.DateTimeFormat('it-IT', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(parseCalendarDate(anchor)));
  }
  const range = calendarRange(view, anchor);
  const end = addCalendarDays(range.end, -1);
  const formatter = new Intl.DateTimeFormat('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `${formatter.format(parseCalendarDate(range.start))} – ${formatter.format(parseCalendarDate(end))}`;
}

export function longCalendarDate(value: string): string {
  return capitalize(new Intl.DateTimeFormat('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parseCalendarDate(value)));
}

export function parseCalendarState(
  params: Record<string, string | null | undefined>,
  today = todayRomeDate(),
): { state: CalendarState; valid: boolean } {
  let valid = true;
  const rawView = params['view'];
  const view = VIEWS.includes(rawView as CalendarView) ? rawView as CalendarView : 'month';
  if (rawView && rawView !== view) valid = false;

  const rawDate = params['date'];
  const date = validCalendarDate(rawDate) ? rawDate : today;
  if (rawDate && rawDate !== date) valid = false;

  const parsedStatuses = csv(params['status']);
  let status = parsedStatuses.filter((item): item is ExpenseStatus =>
    STATUSES.includes(item as ExpenseStatus));
  if (parsedStatuses.length !== status.length) valid = false;
  if (!status.length) status = ['PLANNED', 'COMPLETED'];

  const categoryId = validUuidOrEmpty(params['categoryId'], () => { valid = false; });
  const rawLabels = csv(params['labelIds']);
  const labelIds = rawLabels.filter((item) => UUID_PATTERN.test(item));
  if (rawLabels.length !== labelIds.length) valid = false;

  const rawPayment = params['paymentMethod'];
  const paymentMethod = PAYMENTS.includes(rawPayment as PaymentMethod)
    ? rawPayment as PaymentMethod
    : '';
  if (rawPayment && !paymentMethod) valid = false;
  const rawSearch = (params['search'] ?? '').trim().replace(/\s+/g, ' ');
  const search = rawSearch.slice(0, 150);
  if (rawSearch !== search) valid = false;

  return {
    state: {
      view,
      date,
      filters: { status, categoryId, labelIds, paymentMethod, search },
    },
    valid,
  };
}

export function calendarQueryParams(state: CalendarState): Record<string, string> {
  const query: Record<string, string> = {
    view: state.view,
    date: state.date,
    status: state.filters.status.join(','),
  };
  if (state.filters.categoryId) query['categoryId'] = state.filters.categoryId;
  if (state.filters.labelIds.length) query['labelIds'] = state.filters.labelIds.join(',');
  if (state.filters.paymentMethod) query['paymentMethod'] = state.filters.paymentMethod;
  if (state.filters.search) query['search'] = state.filters.search;
  return query;
}

export function activeCalendarFilterCount(filters: CalendarFilters): number {
  const defaultStatus =
    filters.status.length === 2
    && filters.status.includes('PLANNED')
    && filters.status.includes('COMPLETED');
  return (defaultStatus ? 0 : 1)
    + Number(Boolean(filters.categoryId))
    + Number(filters.labelIds.length > 0)
    + Number(Boolean(filters.paymentMethod))
    + Number(Boolean(filters.search));
}

function parseCalendarDate(value: string): Date {
  if (!validCalendarDate(value)) throw new Error(`Data calendario non valida: ${value}`);
  return new Date(`${value}T00:00:00.000Z`);
}
function isoCalendarDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}
function addUtcDays(value: Date, days: number): Date {
  return new Date(value.getTime() + days * DAY_MS);
}
function startOfWeek(value: Date): Date {
  return addUtcDays(value, -((value.getUTCDay() + 6) % 7));
}
function csv(value: string | null | undefined): string[] {
  return value ? [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))] : [];
}
function validUuidOrEmpty(value: string | null | undefined, invalid: () => void): string {
  if (!value) return '';
  if (UUID_PATTERN.test(value)) return value;
  invalid();
  return '';
}
function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
