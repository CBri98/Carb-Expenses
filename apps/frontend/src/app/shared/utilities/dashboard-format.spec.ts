import { describe, expect, it } from 'vitest';
import { changeLabel, dashboardPeriodLabel, dueLabel, shiftDashboardPeriod } from './dashboard-format';

describe('dashboard formatting', () => {
  it('formatta periodo, scadenze e variazioni con testo accessibile', () => {
    expect(dashboardPeriodLabel(7, 2026)).toBe('Luglio 2026');
    expect(dueLabel(0, '2026-07-16')).toBe('Oggi');
    expect(dueLabel(1, '2026-07-17')).toBe('Domani');
    expect(changeLabel('INCREASE', 10.7)).toBe('Aumento del 10,7%');
    expect(changeLabel('NOT_COMPARABLE', null)).toBe('Confronto non disponibile');
  });
  it('attraversa correttamente il cambio anno', () => {
    expect(shiftDashboardPeriod(1, 2026, -1)).toEqual({ month: 12, year: 2025 });
  });
});
