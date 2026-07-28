import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgSelectComponent } from '@ng-select/ng-select';
import { catchError, combineLatest, EMPTY, finalize, type Observable, startWith, Subject, switchMap, tap } from 'rxjs';

import { DashboardService } from '../../core/services/dashboard.service';
import { ExpenseService } from '../../core/services/expense.service';
import { SettingsStore } from '../../core/services/settings.store';
import { AppBreadcrumbComponent } from '../../shared/components/app-breadcrumb.component';
import { EuroAmountPipe, ItalianExtendedDatePipe } from '../../shared/components/expense-display.components';
import type { DashboardData, DashboardPeriodQuery, RecentExpense, UpcomingExpense } from '../../shared/models/dashboard.models';
import { changeLabel, dashboardPeriodLabel, ITALIAN_MONTHS, shiftDashboardPeriod } from '../../shared/utilities/dashboard-format';
import { formatEuroAmount, formatItalianDate } from '../../shared/utilities/expense-format';
import { DashboardChartComponent, type DashboardChartSelection } from './dashboard-chart.component';
import { RecentExpensesComponent } from './recent-expenses.component';
import { StatCardComponent } from './stat-card.component';
import { UpcomingExpensesComponent } from './upcoming-expenses.component';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, FormsModule, NgSelectComponent, AppBreadcrumbComponent, EuroAmountPipe, ItalianExtendedDatePipe, DashboardChartComponent, RecentExpensesComponent, StatCardComponent, UpcomingExpensesComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly dashboard = inject(DashboardService);
  private readonly expenses = inject(ExpenseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly settings = inject(SettingsStore);
  private readonly refresh = new Subject<void>();
  private readonly today = currentPeriod();
  private trendMonthsManual = false;

  readonly months = ITALIAN_MONTHS;
  readonly monthOptions = ITALIAN_MONTHS.map((label, index) => ({ value: index + 1, label }));
  readonly years = Array.from({ length: 101 }, (_, index) => 2000 + index);
  readonly skeletonCards = [1, 2, 3, 4, 5, 6];
  readonly selected = signal<DashboardPeriodQuery>(this.today);
  readonly currentYear = this.today.year;
  readonly trendYear = signal(this.currentYear);
  readonly trendMonths = signal<6 | 12>(this.settings.experience().dashboardTrendMonths);
  readonly trendMonthOptions = [{ value: 6, label: '6 mesi' }, { value: 12, label: '12 mesi' }] as const;
  readonly data = signal<DashboardData | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly actionBusy = signal<string | null>(null);
  readonly hiddenCategoryIds = signal<ReadonlySet<string>>(new Set());

  readonly periodLabel = computed(() => dashboardPeriodLabel(this.selected().month, this.selected().year));
  readonly dailyLabels = computed(() => this.data()?.dailyTrend.map((point) => String(point.day)) ?? []);
  readonly dailyValues = computed(() => this.data()?.dailyTrend.map((point) => Number(point.total)) ?? []);
  readonly dailyCounts = computed(() => this.data()?.dailyTrend.map((point) => point.expenseCount) ?? []);
  readonly visibleCategories = computed(() => {
    const hidden = this.hiddenCategoryIds();
    return this.data()?.categoryDistribution.filter((item) => !hidden.has(item.categoryId)) ?? [];
  });
  readonly categoryLabels = computed(() => this.visibleCategories().map((item) => item.name));
  readonly categoryValues = computed(() => this.visibleCategories().map((item) => Number(item.total)));
  readonly categoryCounts = computed(() => this.visibleCategories().map((item) => item.expenseCount));
  readonly categoryColors = computed(() => this.visibleCategories().map((item) => item.color));
  readonly topDistributionCategory = computed(() => this.data()?.categoryDistribution[0] ?? null);
  readonly historyLabels = computed(() => this.data()?.monthlyTrend.map((point) => point.label) ?? []);
  readonly historyValues = computed(() => this.data()?.monthlyTrend.map((point) => Number(point.total)) ?? []);
  readonly historyCounts = computed(() => this.data()?.monthlyTrend.map((point) => point.expenseCount) ?? []);
  readonly hasHistory = computed(() => this.historyValues().some((value) => value > 0));
  readonly dailyDescription = computed(() => {
    return `Spese completate giorno per giorno a ${this.periodLabel().toLowerCase()}.`;
  });
  readonly dailyInsights = computed(() => {
    const dashboard = this.data();
    const points = dashboard?.dailyTrend ?? [];
    const spendingDays = points.filter((point) => Number(point.total) > 0);
    const peak = spendingDays.length
      ? spendingDays.reduce((current, point) => Number(point.total) > Number(current.total) ? point : current)
      : null;
    return {
      peak: peak ? `${formatItalianDate(peak.date)} — ${formatEuroAmount(peak.total)}` : 'Nessun dato',
      average: dashboard ? formatEuroAmount(dashboard.summary.dailyAverage) : formatEuroAmount('0.00'),
      emptyDays: points.filter((point) => Number(point.total) === 0).length,
    };
  });
  readonly historyPeak = computed(() => {
    const points = this.data()?.monthlyTrend.filter((point) => Number(point.total) > 0) ?? [];
    if (!points.length) return null;
    const peak = points.reduce((current, point) => Number(point.total) > Number(current.total) ? point : current);
    return { label: peak.label, total: formatEuroAmount(peak.total) };
  });
  readonly historyInsights = computed(() => {
    const points = this.data()?.monthlyTrend.filter((point) => Number(point.total) > 0) ?? [];
    if (!points.length) return null;
    const highest = points.reduce((current, point) => Number(point.total) > Number(current.total) ? point : current);
    const lowest = points.reduce((current, point) => Number(point.total) < Number(current.total) ? point : current);
    const average = points.reduce((total, point) => total + Number(point.total), 0) / points.length;
    const first = Number(points[0]?.total ?? 0);
    const last = Number(points.at(-1)?.total ?? 0);
    const change = last - first;
    return {
      highest: `${highest.label} — ${formatEuroAmount(highest.total)}`,
      lowest: `${lowest.label} — ${formatEuroAmount(lowest.total)}`,
      average: formatEuroAmount(average.toFixed(2)),
      change: `${change > 0 ? '+' : ''}${formatEuroAmount(change.toFixed(2))}`,
    };
  });

  constructor() {
    this.settings.ensureLoaded();
    combineLatest([
      this.route.queryParamMap,
      this.refresh.pipe(startWith(undefined)),
    ])
      .pipe(
        tap(([params]) => {
          const period = periodFromParams(params.get('month'), params.get('year'), this.today);
          const previous = this.selected();
          if (previous.month !== period.month || previous.year !== period.year) {
            this.hiddenCategoryIds.set(new Set());
          }
          this.selected.set(period);
          if (params.get('month') === null || params.get('year') === null) {
            void this.navigate(period, true);
          }
          this.loading.set(true);
          this.error.set(null);
        }),
        switchMap(() =>
          this.dashboard.load(this.selected(), this.trendYear(), this.trendMonths()).pipe(
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
    effect(() => {
      const preferred = this.settings.experience().dashboardTrendMonths;
      if (this.settings.loaded() && !this.trendMonthsManual && preferred !== this.trendMonths()) {
        this.trendMonths.set(preferred);
        this.refresh.next();
      }
    });
  }

  previousMonth(): void { void this.navigate(shiftDashboardPeriod(this.selected().month, this.selected().year, -1)); }
  nextMonth(): void { void this.navigate(shiftDashboardPeriod(this.selected().month, this.selected().year, 1)); }
  currentMonth(): void { void this.navigate(this.today); }
  selectMonth(month: number): void {
    if (!Number.isInteger(month) || month < 1 || month > 12) return;
    void this.navigate({ ...this.selected(), month });
  }
  selectYear(event: Event): void {
    const year = Number((event.target as HTMLInputElement).value);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) return;
    void this.navigate({ ...this.selected(), year });
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
  selectTrendMonths(value: number): void {
    const months = Number(value);
    if ((months !== 6 && months !== 12) || months === this.trendMonths()) return;
    this.trendMonthsManual = true;
    this.trendMonths.set(months);
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
  nextExpenseDetail(expense: DashboardData['summary']['nextPlannedExpense']): string {
    return expense ? `${formatEuroAmount(expense.amount)} · ${formatItalianDate(expense.expenseDate)}` : 'Nessuna spesa pianificata';
  }

  openTopCategory(): void {
    const category = this.data()?.summary.topCategory;
    if (!category) return;
    void this.router.navigate(['/expenses'], { queryParams: {
      month: this.selected().month, year: this.selected().year,
      categoryIds: category.id, statuses: 'COMPLETED',
    } });
  }

  openFutureExpenses(): void {
    void this.router.navigate(['/expenses'], { queryParams: { statuses: 'PLANNED' } });
  }

  openNextExpense(): void {
    const expense = this.data()?.summary.nextPlannedExpense;
    if (expense) void this.router.navigate(['/expenses', expense.id]);
  }

  openDailyPoint(selection: DashboardChartSelection): void {
    const point = this.data()?.dailyTrend[selection.index];
    if (!point) return;
    void this.router.navigate(['/expenses'], { queryParams: {
      dateFrom: point.date, dateTo: point.date, statuses: 'COMPLETED',
    } });
  }

  openCategoryPoint(selection: DashboardChartSelection): void {
    const item = this.visibleCategories()[selection.index];
    if (!item) return;
    void this.router.navigate(['/expenses'], { queryParams: {
      month: this.selected().month, year: this.selected().year,
      categoryIds: item.categoryId, statuses: 'COMPLETED',
    } });
  }

  openHistoryPoint(selection: DashboardChartSelection): void {
    const point = this.data()?.monthlyTrend[selection.index];
    if (!point) return;
    void this.router.navigate(['/expenses'], { queryParams: {
      month: point.month, year: point.year, statuses: 'COMPLETED',
    } });
  }

  openDailyIndex(index: number): void {
    this.openDailyPoint({ index, datasetIndex: 0, label: '', value: null });
  }

  openCategoryIndex(index: number): void {
    this.openCategoryPoint({ index, datasetIndex: 0, label: '', value: null });
  }

  isCategoryHidden(categoryId: string): boolean {
    return this.hiddenCategoryIds().has(categoryId);
  }

  toggleCategoryVisibility(categoryId: string): void {
    const next = new Set(this.hiddenCategoryIds());
    if (next.has(categoryId)) next.delete(categoryId);
    else next.add(categoryId);
    this.hiddenCategoryIds.set(next);
  }

  showAllCategories(): void {
    this.hiddenCategoryIds.set(new Set());
  }

  openHistoryIndex(index: number): void {
    this.openHistoryPoint({ index, datasetIndex: 0, label: '', value: null });
  }

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
