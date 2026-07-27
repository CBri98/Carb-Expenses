import { BadRequestException, Injectable } from '@nestjs/common';
import { RecurrenceFrequency } from '@prisma/client';

import { formatExpenseDate, parseExpenseDate } from '../expenses/expense.utils';

export interface RecurrenceSchedule {
  frequency: RecurrenceFrequency;
  interval: number;
  startDate: Date;
  endDate: Date | null;
  maxOccurrences: number | null;
}

@Injectable()
export class RecurrenceCalculatorService {
  next(current: Date, schedule: Pick<RecurrenceSchedule, 'frequency' | 'interval' | 'startDate'>): Date {
    if (!Number.isInteger(schedule.interval) || schedule.interval < 1) {
      throw new BadRequestException("L'intervallo deve essere maggiore di zero");
    }
    const anchorMonth = schedule.startDate.getUTCMonth();
    const anchorDay = schedule.startDate.getUTCDate();
    switch (schedule.frequency) {
      case RecurrenceFrequency.DAILY:
        return addUtcDays(current, schedule.interval);
      case RecurrenceFrequency.WEEKLY:
        return addUtcDays(current, schedule.interval * 7);
      case RecurrenceFrequency.MONTHLY: {
        const monthIndex =
          current.getUTCFullYear() * 12 + current.getUTCMonth() + schedule.interval;
        const year = Math.floor(monthIndex / 12);
        const month = ((monthIndex % 12) + 12) % 12;
        return utcDate(year, month, Math.min(anchorDay, daysInMonth(year, month)));
      }
      case RecurrenceFrequency.YEARLY: {
        const year = current.getUTCFullYear() + schedule.interval;
        return utcDate(
          year,
          anchorMonth,
          Math.min(anchorDay, daysInMonth(year, anchorMonth)),
        );
      }
      default:
        throw new BadRequestException('Frequenza della ricorrenza non valida');
    }
  }

  preview(
    first: Date,
    schedule: RecurrenceSchedule,
    limit: number,
    alreadyGenerated = 0,
  ): Date[] {
    const result: Date[] = [];
    let candidate = first;
    let count = alreadyGenerated;
    while (result.length < limit && this.withinLimits(candidate, schedule, count)) {
      result.push(candidate);
      count += 1;
      candidate = this.next(candidate, schedule);
    }
    return result;
  }

  firstOnOrAfter(candidate: Date, minimum: Date, schedule: RecurrenceSchedule): Date | null {
    let current = candidate;
    for (let index = 0; index < 100_000; index += 1) {
      if (schedule.endDate && current > schedule.endDate) return null;
      if (current >= minimum) return current;
      current = this.next(current, schedule);
    }
    throw new BadRequestException('La ricorrenza supera il limite di calcolo supportato');
  }

  isOccurrenceDate(target: Date, schedule: RecurrenceSchedule): boolean {
    let current = schedule.startDate;
    for (let index = 0; index < 100_000 && current <= target; index += 1) {
      if (current.getTime() === target.getTime()) return true;
      current = this.next(current, schedule);
    }
    return false;
  }

  withinLimits(date: Date, schedule: RecurrenceSchedule, generatedCount: number): boolean {
    if (schedule.endDate && date > schedule.endDate) return false;
    return schedule.maxOccurrences === null || generatedCount < schedule.maxOccurrences;
  }

  horizon(today: Date, daysAhead: number): Date {
    return addUtcDays(today, daysAhead);
  }

  parse(value: string, field: string): Date {
    return parseExpenseDate(value, field);
  }

  format(value: Date): string {
    return formatExpenseDate(value);
  }
}

function addUtcDays(date: Date, days: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + days));
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

function utcDate(year: number, month: number, day: number): Date {
  const value = new Date(Date.UTC(year, month, day));
  if (!Number.isFinite(value.getTime()) || value.getUTCFullYear() !== year) {
    throw new BadRequestException('La ricorrenza supera il limite delle date supportate');
  }
  return value;
}
