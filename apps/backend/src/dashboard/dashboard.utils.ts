export const DASHBOARD_TIMEZONE = 'Europe/Rome';

export interface DashboardMonthRange {
  month: number; year: number; start: Date; endExclusive: Date;
  daysInMonth: number; label: string; shortLabel: string;
}
export interface RomeCalendarDate { year: number; month: number; day: number }

export function romeCalendarDate(now = new Date()): RomeCalendarDate {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: DASHBOARD_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: value('year'), month: value('month'), day: value('day') };
}
export function monthRange(year: number, month: number): DashboardMonthRange {
  const start = dateOnly(year, month, 1);
  const endExclusive = dateOnly(month === 12 ? year + 1 : year, month === 12 ? 1 : month + 1, 1);
  const daysInMonth = Math.round((endExclusive.getTime() - start.getTime()) / 86_400_000);
  const labelDate = new Date(Date.UTC(year, month - 1, 1));
  return {
    month, year, start, endExclusive, daysInMonth,
    label: capitalize(new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(labelDate)),
    shortLabel: capitalize(new Intl.DateTimeFormat('it-IT', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(labelDate).replace('.', '')),
  };
}
export function previousMonth(range: Pick<DashboardMonthRange, 'year' | 'month'>): DashboardMonthRange {
  return range.month === 1 ? monthRange(range.year - 1, 12) : monthRange(range.year, range.month - 1);
}
export function shiftMonth(year: number, month: number, offset: number): DashboardMonthRange {
  const value = year * 12 + month - 1 + offset;
  return monthRange(Math.floor(value / 12), ((value % 12) + 12) % 12 + 1);
}
export function dateOnly(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}
export function isoDate(date: Date): string { return date.toISOString().slice(0, 10); }
export function daysBetween(from: Date, to: Date): number {
  return Math.round((Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate()) - Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())) / 86_400_000);
}
function capitalize(value: string): string { return value.charAt(0).toUpperCase() + value.slice(1); }
