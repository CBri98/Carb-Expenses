import type { DashboardChangeDirection } from '../models/dashboard.models';

export const ITALIAN_MONTHS = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
] as const;

export function dashboardPeriodLabel(month: number, year: number): string {
  return `${ITALIAN_MONTHS[month - 1] ?? ''} ${year}`;
}

export function dueLabel(days: number, date: string): string {
  if (days === 0) return 'Oggi';
  if (days === 1) return 'Domani';
  if (days <= 7) return `Tra ${days} giorni`;
  return new Intl.DateTimeFormat('it-IT', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00.000Z`));
}

export function changeLabel(direction: DashboardChangeDirection, percentage: number | null): string {
  if (direction === 'NOT_COMPARABLE') return 'Confronto non disponibile';
  if (direction === 'UNCHANGED') return 'Nessuna variazione';
  const value = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 }).format(Math.abs(percentage ?? 0));
  return direction === 'INCREASE' ? `Aumento del ${value}%` : `Diminuzione del ${value}%`;
}

export function shiftDashboardPeriod(month: number, year: number, offset: number): DashboardPeriodQuery {
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return { month: date.getUTCMonth() + 1, year: date.getUTCFullYear() };
}

interface DashboardPeriodQuery { month: number; year: number }
