import { BadRequestException } from '@nestjs/common';
import { ReminderType } from '@prisma/client';

import { formatExpenseDate, formatExpenseTime } from '../expenses/expense.utils';

export const REMINDER_OFFSET_MINUTES: Readonly<Record<Exclude<ReminderType, 'CUSTOM'>, number>> = {
  SAME_DAY: 0,
  ONE_DAY_BEFORE: 1_440,
  THREE_DAYS_BEFORE: 4_320,
  SEVEN_DAYS_BEFORE: 10_080,
};

export function expenseDeadlineUtc(
  expenseDate: Date,
  expenseTime: Date | null,
  defaultTime: string,
  timezone: string,
): Date {
  return localDateTimeToUtc(
    formatExpenseDate(expenseDate),
    formatExpenseTime(expenseTime) ?? defaultTime,
    timezone,
  );
}

export function scheduledAtForPreset(
  type: Exclude<ReminderType, 'CUSTOM'>,
  deadline: Date,
): Date {
  return new Date(deadline.getTime() - REMINDER_OFFSET_MINUTES[type] * 60_000);
}

export function localCalendarDate(now: Date, timezone: string): string {
  const parts = zonedParts(now, timezone);
  return `${parts.year}-${two(parts.month)}-${two(parts.day)}`;
}

export function localDateOnly(now: Date, timezone: string): Date {
  return new Date(`${localCalendarDate(now, timezone)}T00:00:00.000Z`);
}

export function localDateTimeToUtc(date: string, time: string, timezone: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match || !timeMatch) throw new BadRequestException('Data o ora locale non valida');

  const desired = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(timeMatch[1]),
    minute: Number(timeMatch[2]),
  };
  const desiredEpoch = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
  );
  let candidate = desiredEpoch;

  for (let iteration = 0; iteration < 4; iteration += 1) {
    const actual = zonedParts(new Date(candidate), timezone);
    const actualEpoch = Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
    );
    candidate += desiredEpoch - actualEpoch;
  }

  const result = new Date(candidate);
  if (!sameLocalMinute(zonedParts(result, timezone), desired)) {
    throw new BadRequestException(
      `L'ora ${time} non esiste nella data selezionata per il fuso ${timezone}`,
    );
  }
  return result;
}

function zonedParts(date: Date, timezone: string): LocalParts {
  let formatter: Intl.DateTimeFormat;
  try {
    formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
  } catch {
    throw new BadRequestException(`Fuso orario non supportato: ${timezone}`);
  }
  const values = new Map(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: values.get('year') ?? 0,
    month: values.get('month') ?? 0,
    day: values.get('day') ?? 0,
    hour: values.get('hour') ?? 0,
    minute: values.get('minute') ?? 0,
  };
}

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function sameLocalMinute(left: LocalParts, right: LocalParts): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute
  );
}

function two(value: number): string {
  return String(value).padStart(2, '0');
}
