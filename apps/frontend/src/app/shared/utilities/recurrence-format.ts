import type {
  RecurrenceFrequency,
  RecurrenceReminderType,
  RecurrenceStatus,
} from '../models/recurrence.models';

export function recurrenceFrequencyLabel(
  frequency: RecurrenceFrequency,
  interval: number,
): string {
  const names: Record<RecurrenceFrequency, [string, string]> = {
    DAILY: ['giorno', 'giorni'],
    WEEKLY: ['settimana', 'settimane'],
    MONTHLY: ['mese', 'mesi'],
    YEARLY: ['anno', 'anni'],
  };
  return interval === 1
    ? `Ogni ${names[frequency][0]}`
    : `Ogni ${interval} ${names[frequency][1]}`;
}

export function recurrenceStatusLabel(status: RecurrenceStatus): string {
  return {
    ACTIVE: 'Attiva',
    PAUSED: 'In pausa',
    COMPLETED: 'Completata',
    CANCELLED: 'Terminata',
  }[status];
}

export function recurrenceReminderLabel(type: RecurrenceReminderType): string {
  return {
    SAME_DAY: 'Il giorno stesso',
    ONE_DAY_BEFORE: '1 giorno prima',
    THREE_DAYS_BEFORE: '3 giorni prima',
    SEVEN_DAYS_BEFORE: '7 giorni prima',
  }[type];
}
