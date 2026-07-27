import { describe, expect, it } from 'vitest';

import {
  activeCalendarFilterCount,
  addCalendarDays,
  calendarDays,
  calendarQueryParams,
  calendarRange,
  parseCalendarState,
  shiftCalendarPeriod,
  todayRomeDate,
  validCalendarDate,
} from './calendar-date';

describe('calendar date utilities', () => {
  it('costruisce la griglia mensile dal lunedì con end esclusivo', () => {
    const range = calendarRange('month', '2026-07-16');
    expect(range).toEqual({ start: '2026-06-29', end: '2026-08-03' });
    const days = calendarDays(range, '2026-07-16', '2026-07-16');
    expect(days).toHaveLength(35);
    expect(days[0]).toMatchObject({ date: '2026-06-29', inCurrentMonth: false });
    expect(days.find((day) => day.isToday)?.date).toBe('2026-07-16');
  });

  it('costruisce settimana lunedì-domenica e lista sul solo mese', () => {
    expect(calendarRange('week', '2026-07-16')).toEqual({
      start: '2026-07-13',
      end: '2026-07-20',
    });
    expect(calendarRange('list', '2024-02-20')).toEqual({
      start: '2024-02-01',
      end: '2024-03-01',
    });
    expect(calendarRange('year', '2024-07-20')).toEqual({
      start: '2024-01-01',
      end: '2025-01-01',
    });
  });

  it('gestisce cambi mese, anni bisestili e date locali senza conversioni implicite', () => {
    expect(shiftCalendarPeriod('2026-03-31', 'month', -1)).toBe('2026-02-28');
    expect(shiftCalendarPeriod('2024-02-29', 'year', 1)).toBe('2025-02-28');
    expect(addCalendarDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(validCalendarDate('2026-02-30')).toBe(false);
    expect(todayRomeDate(new Date('2026-07-15T22:30:00Z'))).toBe('2026-07-16');
  });

  it('normalizza filtri URL, scarta valori invalidi e serializza lo stato canonico', () => {
    const categoryId = '10000000-0000-4000-8000-000000000001';
    const parsed = parseCalendarState({
      view: 'week',
      date: '2026-07-16',
      status: 'PLANNED,CANCELLED',
      categoryId,
      labelIds: '20000000-0000-4000-8000-000000000001',
      paymentMethod: 'CASH',
      search: '  treno   roma ',
    });
    expect(parsed.valid).toBe(true);
    expect(parsed.state.filters.search).toBe('treno roma');
    expect(activeCalendarFilterCount(parsed.state.filters)).toBe(5);
    expect(calendarQueryParams(parsed.state)).toMatchObject({
      view: 'week',
      date: '2026-07-16',
      status: 'PLANNED,CANCELLED',
      categoryId,
      paymentMethod: 'CASH',
    });

    const annual = parseCalendarState({
      view: 'year',
      date: '2026-07-16',
      status: 'PLANNED,COMPLETED',
    });
    expect(annual).toMatchObject({ valid: true, state: { view: 'year' } });

    const invalid = parseCalendarState({
      view: 'decade',
      date: '2026-02-30',
      status: 'UNKNOWN',
    }, '2026-07-16');
    expect(invalid.valid).toBe(false);
    expect(invalid.state).toMatchObject({
      view: 'month',
      date: '2026-07-16',
      filters: { status: ['PLANNED', 'COMPLETED'] },
    });
  });
});
