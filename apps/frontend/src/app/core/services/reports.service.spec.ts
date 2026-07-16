import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import type { ApiEnvelope } from '../auth/auth.models';
import type { MonthComparison, MonthlyReport } from '../../shared/models/report.models';
import { ReportsService } from './reports.service';

const monthly: MonthlyReport = {
  period: { month: 7, year: 2026, label: 'Luglio 2026', shortLabel: 'Lug 2026', daysInMonth: 31, isCurrentMonth: true },
  summary: { completedTotal: '100.00', plannedTotal: '20.00', completedCount: 2, plannedCount: 1, cancelledCount: 0, dailyAverage: '6.25', transactionAverage: '50.00' },
  highestSpendingDay: null,
  highestExpense: null,
  topCategory: null,
  categoryDistribution: [],
  dailyTrend: [],
  paymentMethodBreakdown: [],
  previousMonthComparison: { previousTotal: '80.00', absoluteChange: '20.00', percentageChange: 25, direction: 'INCREASE' },
};
const comparison: MonthComparison = {
  periodA: { ...monthly.period, month: 6, label: 'Giugno 2026', shortLabel: 'Giu 2026', daysInMonth: 30, isCurrentMonth: false },
  periodB: monthly.period,
  samePeriod: false,
  metrics: [],
  categories: [],
  daily: [{ day: 31, periodADate: null, periodBDate: '2026-07-31', periodATotal: null, periodBTotal: '0.00', periodACount: null, periodBCount: 0 }],
  paymentMethods: [],
};
const envelope = <T>(data: T, meta: Record<string, unknown> = {}): ApiEnvelope<T> => ({
  data,
  meta,
  message: '',
});

describe('ReportsService', () => {
  let service: ReportsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReportsService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('carica il report mensile con periodo esplicito e importi stringa', () => {
    service.monthly({ month: 7, year: 2026 }).subscribe((value) => {
      expect(value.summary.completedTotal).toBe('100.00');
    });
    const request = http.expectOne((candidate) =>
      candidate.url === `${environment.apiBaseUrl}/reports/monthly` &&
      candidate.params.get('month') === '7' &&
      candidate.params.get('year') === '2026',
    );
    request.flush(envelope(monthly));
  });

  it('mantiene periodo fisso, filtri e paginazione server-side nell’elenco', () => {
    service.monthlyExpenses({
      month: 7,
      year: 2026,
      page: 2,
      pageSize: 10,
      status: 'COMPLETED',
      labelIds: ['a', 'b'],
    }).subscribe((value) => expect(value.meta).toEqual({
      page: 2,
      pageSize: 10,
      totalItems: 12,
      totalPages: 2,
    }));
    const request = http.expectOne((candidate) =>
      candidate.url.endsWith('/reports/monthly/expenses') &&
      candidate.params.get('month') === '7' &&
      candidate.params.get('labelIds') === 'a,b',
    );
    request.flush(envelope([], { page: 2, pageSize: 10, totalItems: 12, totalPages: 2 }));
  });

  it('espone confronto completo e dataset giornaliero CALENDAR_DAY', () => {
    const query = { monthA: 6, yearA: 2026, monthB: 7, yearB: 2026 };
    service.monthComparison(query).subscribe((value) => expect(value.daily[0]?.periodATotal).toBeNull());
    http.expectOne((candidate) => candidate.url.endsWith('/reports/month-comparison')).flush(envelope(comparison));

    service.dailyComparison(query).subscribe((value) => expect(value[0]?.day).toBe(31));
    const daily = http.expectOne((candidate) =>
      candidate.url.endsWith('/reports/daily-comparison') &&
      candidate.params.get('mode') === 'CALENDAR_DAY',
    );
    daily.flush(envelope(comparison.daily));
  });
});
