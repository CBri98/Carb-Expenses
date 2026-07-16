import { describe, expect, it } from 'vitest';

import type {
  CategoryComparisonItem,
  MonthComparison,
} from '../models/report.models';
import {
  comparisonNarrative,
  dailyComparisonValues,
  filteredCategories,
  percentageLabel,
  reportPeriodFromParams,
} from './report-format';

const category = (name: string, direction: CategoryComparisonItem['direction'], change: string): CategoryComparisonItem => ({
  id: name,
  categoryId: name,
  name,
  color: '#112233',
  icon: 'bi-tag',
  periodATotal: '10.00',
  periodBTotal: '20.00',
  periodACount: 1,
  periodBCount: 2,
  absoluteChange: change,
  percentageChange: 100,
  direction,
});

describe('report format utilities', () => {
  it('valida il periodo URL e usa il fallback per valori incompleti', () => {
    expect(reportPeriodFromParams('7', '2026', { month: 1, year: 2025 })).toEqual({ month: 7, year: 2026 });
    expect(reportPeriodFromParams('13', '2026', { month: 1, year: 2025 })).toEqual({ month: 1, year: 2025 });
  });

  it('mantiene null per i giorni inesistenti nei dataset Chart.js', () => {
    const points = [{
      day: 31,
      periodADate: null,
      periodBDate: '2026-07-31',
      periodATotal: null,
      periodBTotal: '24.00',
      periodACount: null,
      periodBCount: 1,
    }];
    expect(dailyComparisonValues(points, 'A')).toEqual([null]);
    expect(dailyComparisonValues(points, 'B')).toEqual([24]);
  });

  it('filtra e ordina categorie senza nasconderle per impostazione predefinita', () => {
    const values = [category('Casa', 'DECREASE', '-5'), category('Ristoranti', 'INCREASE', '20')];
    expect(filteredCategories(values, 'ALL', 'CHANGE').map((item) => item.name)).toEqual(['Ristoranti', 'Casa']);
    expect(filteredCategories(values, 'DECREASE', 'NAME').map((item) => item.name)).toEqual(['Casa']);
  });

  it('rende esplicita una percentuale non confrontabile', () => {
    expect(percentageLabel(null)).toBe('non confrontabile');
    expect(percentageLabel(-12.9)).toBe('-12,9%');
  });

  it('genera un riepilogo neutrale e deterministico', () => {
    const comparison = {
      periodA: { month: 6, year: 2026, label: 'Giugno 2026', shortLabel: 'Giu 2026', daysInMonth: 30, isCurrentMonth: false },
      periodB: { month: 7, year: 2026, label: 'Luglio 2026', shortLabel: 'Lug 2026', daysInMonth: 31, isCurrentMonth: true },
      samePeriod: false,
      metrics: [{ metric: 'COMPLETED_TOTAL', valueKind: 'MONEY', periodAValue: '100.00', periodBValue: '120.00', absoluteChange: '20.00', percentageChange: 20, direction: 'INCREASE' }],
      categories: [category('Ristoranti', 'INCREASE', '15.00')],
      daily: [],
      paymentMethods: [],
    } satisfies MonthComparison;
    const narrative = comparisonNarrative(comparison);
    expect(narrative[0]).toContain('20,00');
    expect(narrative[1]).toContain('Ristoranti');
    expect(narrative.join(' ')).not.toContain('troppo');
  });
});
