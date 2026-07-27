import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { DashboardService } from '../../core/services/dashboard.service';
import { ExpenseService } from '../../core/services/expense.service';
import type { DashboardData } from '../../shared/models/dashboard.models';
import { DashboardChartComponent } from './dashboard-chart.component';
import { DashboardComponent } from './dashboard.component';

const data: DashboardData = {
  summary: {
    period: { month: 7, year: 2026, label: 'Luglio 2026', isCurrentMonth: true },
    totalSpent: '0.00',
    previousPeriodTotal: '0.00',
    absoluteChange: '0.00',
    percentageChange: 0,
    changeDirection: 'UNCHANGED',
    expenseCount: 0,
    dailyAverage: '0.00',
    topCategory: null,
    plannedTotal: '0.00',
    nextPlannedExpense: null,
  },
  dailyTrend: [],
  categoryDistribution: [],
  monthlyTrend: [],
  recentExpenses: [],
  upcomingExpenses: [],
};

describe('DashboardComponent', () => {
  it('inizializza l’anno corrente e ricarica lo storico per un anno personalizzato', async () => {
    const load = vi.fn(() => of(data));
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: { load } },
        { provide: ExpenseService, useValue: { changeVersion: signal(0).asReadonly(), duplicate: vi.fn(), setStatus: vi.fn() } },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({ month: '7', year: '2026' })) } },
      ],
    })
      .overrideComponent(DashboardChartComponent, { set: { template: '' } })
      .compileComponents();

    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const periodYear = element.querySelector<HTMLInputElement>('.dashboard-year-input');
    const trendMonths = element.querySelector<HTMLSelectElement>('#dashboard-trend-months');
    const trendYear = element.querySelector<HTMLSelectElement>('.history-year-controls label select');
    const currentYear = Number(new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
    }).format(new Date()));

    expect(periodYear?.value).toBe('2026');
    expect(trendMonths?.value).toBe('6');
    expect(trendYear?.value).toBe(String(currentYear));
    expect(load).toHaveBeenCalledWith({ month: 7, year: 2026 }, currentYear, 6);

    if (!trendYear) throw new Error('Selettore anno andamento non trovato');
    trendYear.value = '2024';
    trendYear.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(load).toHaveBeenLastCalledWith({ month: 7, year: 2026 }, 2024, 6);
  });
});
