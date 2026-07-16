import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { CategoryService } from '../../core/services/category.service';
import { ExpenseService } from '../../core/services/expense.service';
import { LabelService } from '../../core/services/label.service';
import { ReportsService } from '../../core/services/reports.service';
import type { MonthComparison, MonthlyReport } from '../../shared/models/report.models';
import { MonthComparisonPageComponent } from './month-comparison-page.component';
import { MonthlyReportPageComponent } from './monthly-report-page.component';

const monthly: MonthlyReport = {
  period: { month: 7, year: 2026, label: 'Luglio 2026', shortLabel: 'Lug 2026', daysInMonth: 31, isCurrentMonth: true },
  summary: { completedTotal: '0.00', plannedTotal: '20.00', completedCount: 0, plannedCount: 1, cancelledCount: 0, dailyAverage: '0.00', transactionAverage: '0.00' },
  highestSpendingDay: null,
  highestExpense: null,
  topCategory: null,
  categoryDistribution: [],
  dailyTrend: [],
  paymentMethodBreakdown: [],
  previousMonthComparison: { previousTotal: '0.00', absoluteChange: '0.00', percentageChange: 0, direction: 'UNCHANGED' },
};
const comparison: MonthComparison = {
  periodA: monthly.period,
  periodB: monthly.period,
  samePeriod: true,
  metrics: [],
  categories: [],
  daily: [],
  paymentMethods: [],
};

describe('report pages URL state', () => {
  it('carica report ed elenco dal periodo URL e naviga al mese precedente', async () => {
    const reports = {
      monthly: vi.fn().mockReturnValue(of(monthly)),
      monthlyExpenses: vi.fn().mockReturnValue(of({
        items: [],
        meta: { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 },
      })),
    };
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    const changeVersion = signal(0);
    await TestBed.configureTestingModule({
      imports: [MonthlyReportPageComponent],
      providers: [
        { provide: ReportsService, useValue: reports },
        { provide: ExpenseService, useValue: { changeVersion: changeVersion.asReadonly() } },
        { provide: CategoryService, useValue: { categories: signal([]), load: vi.fn().mockReturnValue(of([])) } },
        { provide: LabelService, useValue: { labels: signal([]), load: vi.fn().mockReturnValue(of([])) } },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({ month: '7', year: '2026' })) } },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(MonthlyReportPageComponent, { set: { template: '' } })
      .compileComponents();

    const fixture = TestBed.createComponent(MonthlyReportPageComponent);
    fixture.detectChanges();
    expect(reports.monthly).toHaveBeenCalledWith({ month: 7, year: 2026 });
    expect(reports.monthlyExpenses).toHaveBeenCalledWith(expect.objectContaining({ month: 7, year: 2026 }));
    fixture.componentInstance.previousMonth();
    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({ month: 6, year: 2026 }),
    }));
  });

  it('ripristina entrambi i periodi, consente stesso mese e scambio', async () => {
    const reports = { monthComparison: vi.fn().mockReturnValue(of(comparison)) };
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    await TestBed.configureTestingModule({
      imports: [MonthComparisonPageComponent],
      providers: [
        { provide: ReportsService, useValue: reports },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({
              monthA: '7',
              yearA: '2026',
              monthB: '7',
              yearB: '2026',
            })),
          },
        },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(MonthComparisonPageComponent, { set: { template: '' } })
      .compileComponents();

    const fixture = TestBed.createComponent(MonthComparisonPageComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.comparison()?.samePeriod).toBe(true);
    expect(reports.monthComparison).toHaveBeenCalledWith({
      monthA: 7,
      yearA: 2026,
      monthB: 7,
      yearB: 2026,
    });
    fixture.componentInstance.swapPeriods();
    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: { monthA: 7, yearA: 2026, monthB: 7, yearB: 2026 },
    }));
  });

  it('aggiorna separatamente periodo A e periodo B senza richieste incomplete', async () => {
    const reports = { monthComparison: vi.fn().mockReturnValue(of(comparison)) };
    const router = { navigate: vi.fn().mockResolvedValue(true) };
    await TestBed.configureTestingModule({
      imports: [MonthComparisonPageComponent],
      providers: [
        { provide: ReportsService, useValue: reports },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({
              monthA: '6', yearA: '2026', monthB: '7', yearB: '2026',
            })),
          },
        },
        { provide: Router, useValue: router },
      ],
    })
      .overrideComponent(MonthComparisonPageComponent, { set: { template: '' } })
      .compileComponents();

    const fixture = TestBed.createComponent(MonthComparisonPageComponent);
    fixture.detectChanges();
    fixture.componentInstance.changePeriodA({ month: 5, year: 2026 });
    fixture.componentInstance.changePeriodB({ month: 8, year: 2026 });
    expect(router.navigate).toHaveBeenNthCalledWith(1, [], expect.objectContaining({
      queryParams: { monthA: 5, yearA: 2026, monthB: 7, yearB: 2026 },
    }));
    expect(router.navigate).toHaveBeenNthCalledWith(2, [], expect.objectContaining({
      queryParams: { monthA: 6, yearA: 2026, monthB: 8, yearB: 2026 },
    }));
  });
});
