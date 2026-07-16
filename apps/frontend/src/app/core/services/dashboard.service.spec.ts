import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import type { ApiEnvelope } from '../auth/auth.models';
import type { DashboardSummary } from '../../shared/models/dashboard.models';
import { DashboardService } from './dashboard.service';

const summary: DashboardSummary = {
  period: { month: 7, year: 2026, label: 'Luglio 2026', isCurrentMonth: true },
  totalSpent: '100.00', previousPeriodTotal: '80.00', absoluteChange: '20.00',
  percentageChange: 25, changeDirection: 'INCREASE', expenseCount: 2, dailyAverage: '6.25',
  topCategory: null, plannedTotal: '50.00', nextPlannedExpense: null,
};
const envelope = <T>(data: T): ApiEnvelope<T> => ({ data, meta: {}, message: '' });

describe('DashboardService', () => {
  let service: DashboardService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(DashboardService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('invia mese e anno al summary e conserva gli importi stringa', () => {
    service.summary({ month: 7, year: 2026 }).subscribe((value) => expect(value.totalSpent).toBe('100.00'));
    const request = http.expectOne((candidate) =>
      candidate.url === `${environment.apiBaseUrl}/dashboard/summary` &&
      candidate.params.get('month') === '7' && candidate.params.get('year') === '2026',
    );
    request.flush(envelope(summary));
  });

  it('carica in parallelo tutte le sezioni e l’intero anno storico selezionato', () => {
    service.load({ month: 7, year: 2026 }, 2025).subscribe((result) => {
      expect(result.summary).toEqual(summary);
      expect(result.dailyTrend).toEqual([]);
    });
    const paths = ['summary', 'daily-trend', 'category-distribution', 'monthly-trend', 'recent-expenses', 'upcoming-expenses'];
    for (const path of paths) {
      const request = http.expectOne((candidate) => candidate.url.endsWith(`/dashboard/${path}`));
      if (path === 'summary') request.flush(envelope(summary));
      else request.flush(envelope([]));
      if (path === 'monthly-trend') {
        expect(request.request.params.get('month')).toBe('12');
        expect(request.request.params.get('year')).toBe('2025');
        expect(request.request.params.get('months')).toBe('12');
      }
    }
  });
});
