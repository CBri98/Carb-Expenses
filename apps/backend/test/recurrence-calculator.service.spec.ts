import { RecurrenceFrequency } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { RecurrenceCalculatorService } from '../src/recurrences/recurrence-calculator.service';

const calculator = new RecurrenceCalculatorService();
const date = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const format = (value: Date): string => value.toISOString().slice(0, 10);

describe('RecurrenceCalculatorService', () => {
  it.each([
    [RecurrenceFrequency.DAILY, 1, '2026-07-01', '2026-07-02'],
    [RecurrenceFrequency.DAILY, 3, '2026-07-01', '2026-07-04'],
    [RecurrenceFrequency.WEEKLY, 1, '2026-07-06', '2026-07-13'],
    [RecurrenceFrequency.WEEKLY, 2, '2026-07-06', '2026-07-20'],
    [RecurrenceFrequency.MONTHLY, 3, '2026-01-15', '2026-04-15'],
    [RecurrenceFrequency.YEARLY, 1, '2026-06-15', '2027-06-15'],
  ])('calcola %s intervallo %i da %s', (frequency, interval, start, expected) => {
    const startDate = date(start);
    expect(format(calculator.next(startDate, { frequency, interval, startDate }))).toBe(expected);
  });

  it('mantiene il giorno 31 usando l’ultimo giorno disponibile senza perdere l’ancora', () => {
    const startDate = date('2027-01-31');
    const february = calculator.next(startDate, {
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      startDate,
    });
    const march = calculator.next(february, {
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      startDate,
    });
    expect(format(february)).toBe('2027-02-28');
    expect(format(march)).toBe('2027-03-31');
  });

  it('usa il 29 febbraio negli anni bisestili e il 28 negli altri', () => {
    const startDate = date('2024-02-29');
    const nonLeap = calculator.next(startDate, {
      frequency: RecurrenceFrequency.YEARLY,
      interval: 1,
      startDate,
    });
    const leap = calculator.next(nonLeap, {
      frequency: RecurrenceFrequency.YEARLY,
      interval: 3,
      startDate,
    });
    expect(format(nonLeap)).toBe('2025-02-28');
    expect(format(leap)).toBe('2028-02-29');
  });

  it('include la data finale ma non date successive', () => {
    const startDate = date('2026-07-01');
    const values = calculator.preview(startDate, {
      frequency: RecurrenceFrequency.DAILY,
      interval: 1,
      startDate,
      endDate: date('2026-07-03'),
      maxOccurrences: null,
    }, 10);
    expect(values.map(format)).toEqual(['2026-07-01', '2026-07-02', '2026-07-03']);
  });

  it('rispetta il massimo numero di occorrenze', () => {
    const startDate = date('2026-07-01');
    const values = calculator.preview(startDate, {
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      startDate,
      endDate: null,
      maxOccurrences: 2,
    }, 10);
    expect(values.map(format)).toEqual(['2026-07-01', '2026-08-01']);
  });

  it('alla ripresa salta le date passate senza generare arretrati', () => {
    const startDate = date('2026-01-01');
    const schedule = {
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      startDate,
      endDate: null,
      maxOccurrences: null,
    };
    expect(format(calculator.firstOnOrAfter(startDate, date('2026-07-18'), schedule)!))
      .toBe('2026-08-01');
  });
});
