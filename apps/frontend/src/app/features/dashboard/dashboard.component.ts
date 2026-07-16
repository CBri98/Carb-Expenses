import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, combineLatest, EMPTY, finalize, type Observable, startWith, Subject, switchMap, tap } from 'rxjs';

import { DashboardService } from '../../core/services/dashboard.service';
import { ExpenseService } from '../../core/services/expense.service';
import { EuroAmountPipe } from '../../shared/components/expense-display.components';
import type { DashboardData, DashboardPeriodQuery, RecentExpense, UpcomingExpense } from '../../shared/models/dashboard.models';
import { changeLabel, dashboardPeriodLabel, ITALIAN_MONTHS, shiftDashboardPeriod } from '../../shared/utilities/dashboard-format';
import { formatEuroAmount } from '../../shared/utilities/expense-format';
import { DashboardChartComponent } from './dashboard-chart.component';
import { RecentExpensesComponent } from './recent-expenses.component';
import { StatCardComponent } from './stat-card.component';
import { UpcomingExpensesComponent } from './upcoming-expenses.component';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, EuroAmountPipe, DashboardChartComponent, RecentExpensesComponent, StatCardComponent, UpcomingExpensesComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly dashboard = inject(DashboardService);
  private readonly expenses = inject(ExpenseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refresh = new Subject<void>();
  private readonly today = currentPeriod();

  readonly months = ITALIAN_MONTHS;
  readonly years = Array.from({ length: 101 }, (_, index) => 2000 + index);
  readonly skeletonCards = [1, 2, 3, 4, 5, 6];
  readonly selected = signal<DashboardPeriodQuery>(this.today);
  readonly currentYear = this.today.year;
  readonly trendYear = signal(this.currentYear);
  readonly data = signal<DashboardData | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly actionBusy = signal<string | null>(null);

  readonly periodLabel = computed(() => dashboardPeriodLabel(this.selected().month, this.selected().year));
  readonly dailyLabels = computed(() => this.data()?.dailyTrend.map((point) => String(point.day)) ?? []);
  readonly dailyValues = computed(() => this.data()?.dailyTrend.map((point) => Number(point.total)) ?? []);
  readonly dailyCounts = computed(() => this.data()?.dailyTrend.map((point) => point.expenseCount) ?? []);
  readonly categoryLabels = computed(() => this.data()?.categoryDistribution.map((item) => item.name) ?? []);
  readonly categoryValues = computed(() => this.data()?.categoryDistribution.map((item) => Number(item.total)) ?? []);
  readonly categoryCounts = computed(() => this.data()?.categoryDistribution.map((item) => item.expenseCount) ?? []);
  readonly categoryColors = computed(() => this.data()?.categoryDistribution.map((item) => item.color) ?? []);
  readonly historyLabels = computed(() => this.data()?.monthlyTrend.map((point) => point.label) ?? []);
  readonly historyValues = computed(() => this.data()?.monthlyTrend.map((point) => Number(point.total)) ?? []);
  readonly historyCounts = computed(() => this.data()?.monthlyTrend.map((point) => point.expenseCount) ?? []);
  readonly hasHistory = computed(() => this.historyValues().some((value) => value > 0));

  constructor() {
    combineLatest([
      this.route.queryParamMap,
      this.refresh.pipe(startWith(undefined)),
    ])
      .pipe(
        tap(([params]) => {
          const period = periodFromParams(params.get('month'), params.get('year'), this.today);
          this.selected.set(period);
          if (params.get('month') === null || params.get('year') === null) {
            void this.navigate(period, true);
          }
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(() =>
          this.dashboard.load(this.selected(), this.trendYear()).pipe(
            tap((data) => this.data.set(data)),
            finalize(() => this.loading.set(false)),
            catchDashboardError((message) => this.error.set(message)),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    effect(() => {
      if (this.expenses.changeVersion() > 0) this.refresh.next();
    });
  }

  previousMonth(): void { void this.navigate(shiftDashboardPeriod(this.selected().month, this.selected().year, -1)); }
  nextMonth(): void { void this.navigate(shiftDashboardPeriod(this.selected().month, this.selected().year, 1)); }
  currentMonth(): void { void this.navigate(this.today); }
  selectMonth(event: Event): void {
    void this.navigate({ ...this.selected(), month: Number((event.target as HTMLSelectElement).value) });
  }
  selectYear(event: Event): void {
    void this.navigate({ ...this.selected(), year: Number((event.target as HTMLSelectElement).value) });
  }
  selectTrendYear(event: Event): void {
    const year = Number((event.target as HTMLSelectElement).value);
    if (!Number.isInteger(year) || year < 2000 || year > 2100 || year === this.trendYear()) return;
    this.trendYear.set(year);
    this.refresh.next();
  }
  selectCurrentTrendYear(): void {
    if (this.trendYear() === this.currentYear) return;
    this.trendYear.set(this.currentYear);
    this.refresh.next();
  }
  retry(): void { this.refresh.next(); }

  duplicate(expense: RecentExpense): void {
    this.actionBusy.set(expense.id);
    this.expenses.duplicate(expense.id)
      .pipe(finalize(() => this.actionBusy.set(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }
  complete(expense: UpcomingExpense): void {
    this.actionBusy.set(expense.id);
    this.expenses.setStatus(expense.id, 'COMPLETED')
      .pipe(finalize(() => this.actionBusy.set(null)), takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  variationText(): string {
    const summary = this.data()?.summary;
    return summary ? changeLabel(summary.changeDirection, summary.percentageChange) : '';
  }
  euro(value: string): string { return formatEuroAmount(value); }

  private navigate(period: DashboardPeriodQuery, replaceUrl = false): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: period,
      replaceUrl,
    });
  }
}

function currentPeriod(): DashboardPeriodQuery {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit',
  }).formatToParts(new Date());
  const value = (type: 'year' | 'month'): number => Number(parts.find((part) => part.type === type)?.value);
  return { month: value('month'), year: value('year') };
}

function periodFromParams(monthValue: string | null, yearValue: string | null, fallback: DashboardPeriodQuery): DashboardPeriodQuery {
  const month = Number(monthValue);
  const year = Number(yearValue);
  return Number.isInteger(month) && month >= 1 && month <= 12 && Number.isInteger(year) && year >= 2000 && year <= 2100
    ? { month, year }
    : fallback;
}

function catchDashboardError(onError: (message: string) => void) {
  return <T>(source: Observable<T>): Observable<T> =>
    source.pipe(catchError(() => {
      onError('Non è stato possibile caricare la dashboard. Riprova tra poco.');
      return EMPTY;
    }));
}
