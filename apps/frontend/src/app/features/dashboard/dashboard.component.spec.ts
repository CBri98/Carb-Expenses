import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
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
    const trendYear = element.querySelector<HTMLInputElement>('#dashboard-trend-year');
    const currentYear = Number(new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Rome',
      year: 'numeric',
    }).format(new Date()));

    expect(periodYear?.value).toBe('2026');
    expect(trendYear?.value).toBe(String(currentYear));
    expect(load).toHaveBeenCalledWith({ month: 7, year: 2026 }, currentYear, 12);

    if (!trendYear) throw new Error('Selettore anno andamento non trovato');
    trendYear.value = '2024';
    trendYear.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    expect(load).toHaveBeenLastCalledWith({ month: 7, year: 2026 }, 2024, 12);

    fixture.componentInstance.data.set({
      ...data,
      categoryDistribution: [
        { id: 'casa', categoryId: 'casa', name: 'Casa', icon: 'bi-house', color: '#2563eb', total: '100.00', percentage: 80, expenseCount: 2 },
        { id: 'auto', categoryId: 'auto', name: 'Auto', icon: 'bi-car-front', color: '#dc2626', total: '25.00', percentage: 20, expenseCount: 1 },
      ],
    });
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(DashboardChartComponent)).componentInstance.showLegend).toBe(false);
    fixture.componentInstance.toggleCategoryVisibility('casa');
    expect(fixture.componentInstance.categoryLabels()).toEqual(['Auto']);
    expect(fixture.componentInstance.isCategoryHidden('casa')).toBe(true);
    fixture.componentInstance.showAllCategories();
    expect(fixture.componentInstance.categoryLabels()).toEqual(['Casa', 'Auto']);
  });

  it('esegue un solo caricamento per ogni nuova mutazione delle spese', async () => {
    const load = vi.fn(() => of(data));
    const changeVersion = signal(4);
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: { load } },
        { provide: ExpenseService, useValue: { changeVersion: changeVersion.asReadonly(), duplicate: vi.fn(), setStatus: vi.fn() } },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({ month: '7', year: '2026' })) } },
      ],
    })
      .overrideComponent(DashboardChartComponent, { set: { template: '' } })
      .compileComponents();

    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(load).toHaveBeenCalledTimes(1);

    changeVersion.set(5);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(load).toHaveBeenCalledTimes(2);

    fixture.detectChanges();
    await fixture.whenStable();
    expect(load).toHaveBeenCalledTimes(2);
  });
});
