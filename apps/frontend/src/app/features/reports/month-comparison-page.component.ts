import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, type ParamMap, Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, finalize, switchMap, tap } from 'rxjs';

import { ReportsService } from '../../core/services/reports.service';
import { LoadingSkeletonComponent } from '../../shared/components/catalog-display.components';
import { EuroAmountPipe, PaymentMethodBadgeComponent } from '../../shared/components/expense-display.components';
import type {
  ComparisonDirection,
  ComparisonMetric,
  ComparisonMetricName,
  MonthComparison,
  MonthComparisonQuery,
  MonthlyReportQuery,
} from '../../shared/models/report.models';
import { shiftDashboardPeriod } from '../../shared/utilities/dashboard-format';
import {
  comparisonDirectionLabel,
  comparisonMetricValue,
  comparisonNarrative,
  currentReportPeriod,
  dailyComparisonValues,
  filteredCategories,
  percentageLabel,
  REPORT_METRIC_LABELS,
  reportPeriodFromParams,
} from '../../shared/utilities/report-format';
import { DashboardChartComponent } from '../dashboard/dashboard-chart.component';
import { MonthSelectorComponent } from './month-selector.component';

type CategoryDirectionFilter = ComparisonDirection | 'ALL';
type CategorySort = 'CHANGE' | 'PERIOD_A' | 'PERIOD_B' | 'NAME';

@Component({
  selector: 'app-month-comparison-page',
  standalone: true,
  imports: [
    RouterLink,
    LoadingSkeletonComponent,
    EuroAmountPipe,
    PaymentMethodBadgeComponent,
    DashboardChartComponent,
    MonthSelectorComponent,
  ],
  templateUrl: './month-comparison-page.component.html',
  styleUrl: './reports.scss',
})
export class MonthComparisonPageComponent {
  private readonly reports = inject(ReportsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly today = currentReportPeriod();
  private readonly initialPrevious = shiftDashboardPeriod(this.today.month, this.today.year, -1);

  readonly query = signal<MonthComparisonQuery>({
    monthA: this.initialPrevious.month,
    yearA: this.initialPrevious.year,
    monthB: this.today.month,
    yearB: this.today.year,
  });
  readonly comparison = signal<MonthComparison | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly categoryDirection = signal<CategoryDirectionFilter>('ALL');
  readonly categorySort = signal<CategorySort>('CHANGE');
  readonly metricLabels = REPORT_METRIC_LABELS;

  readonly periodA = computed<MonthlyReportQuery>(() => ({
    month: this.query().monthA,
    year: this.query().yearA,
  }));
  readonly periodB = computed<MonthlyReportQuery>(() => ({
    month: this.query().monthB,
    year: this.query().yearB,
  }));
  readonly categoryRows = computed(() =>
    filteredCategories(
      this.comparison()?.categories ?? [],
      this.categoryDirection(),
      this.categorySort(),
    ),
  );
  readonly categoryLabels = computed(() => this.comparison()?.categories.map((item) => item.name) ?? []);
  readonly categoryAValues = computed(() => this.comparison()?.categories.map((item) => Number(item.periodATotal)) ?? []);
  readonly categoryBValues = computed(() => this.comparison()?.categories.map((item) => Number(item.periodBTotal)) ?? []);
  readonly categoryACounts = computed(() => this.comparison()?.categories.map((item) => item.periodACount) ?? []);
  readonly categoryBCounts = computed(() => this.comparison()?.categories.map((item) => item.periodBCount) ?? []);
  readonly dailyLabels = computed(() => this.comparison()?.daily.map((point) => String(point.day)) ?? []);
  readonly dailyAValues = computed(() => dailyComparisonValues(this.comparison()?.daily ?? [], 'A'));
  readonly dailyBValues = computed(() => dailyComparisonValues(this.comparison()?.daily ?? [], 'B'));
  readonly dailyACounts = computed(() => this.comparison()?.daily.map((point) => point.periodACount ?? 0) ?? []);
  readonly dailyBCounts = computed(() => this.comparison()?.daily.map((point) => point.periodBCount ?? 0) ?? []);
  readonly totalLabels = ['Completate', 'Pianificate'];
  readonly totalAValues = computed(() => [
    Number(this.metric('COMPLETED_TOTAL')?.periodAValue ?? 0),
    Number(this.metric('PLANNED_TOTAL')?.periodAValue ?? 0),
  ]);
  readonly totalBValues = computed(() => [
    Number(this.metric('COMPLETED_TOTAL')?.periodBValue ?? 0),
    Number(this.metric('PLANNED_TOTAL')?.periodBValue ?? 0),
  ]);
  readonly narrative = computed(() => {
    const value = this.comparison();
    return value ? comparisonNarrative(value) : [];
  });
  readonly noData = computed(() => {
    const completed = this.metric('COMPLETED_TOTAL');
    const planned = this.metric('PLANNED_TOTAL');
    return completed?.periodAValue === '0.00' && completed.periodBValue === '0.00' &&
      planned?.periodAValue === '0.00' && planned.periodBValue === '0.00';
  });

  constructor() {
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          const parsed = comparisonFromParams(params, this.today);
          if (!parsed.valid) {
            void this.navigate(parsed.query, true);
            return EMPTY;
          }
          this.query.set(parsed.query);
          this.loading.set(true);
          this.error.set(null);
          return this.reports.monthComparison(parsed.query).pipe(
            tap((comparison) => this.comparison.set(comparison)),
            catchError(() => {
              this.error.set('Non è stato possibile confrontare i periodi selezionati.');
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  changePeriodA(period: MonthlyReportQuery): void {
    void this.navigate({ ...this.query(), monthA: period.month, yearA: period.year });
  }
  changePeriodB(period: MonthlyReportQuery): void {
    void this.navigate({ ...this.query(), monthB: period.month, yearB: period.year });
  }
  swapPeriods(): void {
    const value = this.query();
    void this.navigate({
      monthA: value.monthB,
      yearA: value.yearB,
      monthB: value.monthA,
      yearB: value.yearA,
    });
  }
  currentVsPrevious(): void {
    const previous = shiftDashboardPeriod(this.today.month, this.today.year, -1);
    void this.navigate({
      monthA: previous.month,
      yearA: previous.year,
      monthB: this.today.month,
      yearB: this.today.year,
    });
  }
  lastTwoMonths(): void {
    const previous = shiftDashboardPeriod(this.today.month, this.today.year, -1);
    const before = shiftDashboardPeriod(previous.month, previous.year, -1);
    void this.navigate({
      monthA: before.month,
      yearA: before.year,
      monthB: previous.month,
      yearB: previous.year,
    });
  }
  retry(): void {
    void this.navigate(this.query());
  }
  setDirection(event: Event): void {
    this.categoryDirection.set((event.target as HTMLSelectElement).value as CategoryDirectionFilter);
  }
  setSort(event: Event): void {
    this.categorySort.set((event.target as HTMLSelectElement).value as CategorySort);
  }
  metric(name: ComparisonMetricName): ComparisonMetric | undefined {
    return this.comparison()?.metrics.find((metric) => metric.metric === name);
  }
  value(metric: ComparisonMetric, amount: string): string {
    return comparisonMetricValue(metric, amount);
  }
  percentage(value: number | null): string { return percentageLabel(value); }
  direction(direction: ComparisonDirection): string { return comparisonDirectionLabel(direction); }
  signedAmount(value: string): string {
    const amount = Number(value);
    const formatted = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' })
      .format(Math.abs(amount));
    return amount > 0 ? `+${formatted}` : amount < 0 ? `−${formatted}` : formatted;
  }
  reportLink(): Record<string, number> {
    return { month: this.query().monthB, year: this.query().yearB };
  }

  private navigate(query: MonthComparisonQuery, replaceUrl = false): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: query,
      replaceUrl,
    });
  }
}

function comparisonFromParams(
  params: ParamMap,
  fallback: MonthlyReportQuery,
): { query: MonthComparisonQuery; valid: boolean } {
  const previous = shiftDashboardPeriod(fallback.month, fallback.year, -1);
  const a = reportPeriodFromParams(params.get('monthA'), params.get('yearA'), previous);
  const b = reportPeriodFromParams(params.get('monthB'), params.get('yearB'), fallback);
  const query = { monthA: a.month, yearA: a.year, monthB: b.month, yearB: b.year };
  const valid =
    params.get('monthA') === String(a.month) &&
    params.get('yearA') === String(a.year) &&
    params.get('monthB') === String(b.month) &&
    params.get('yearB') === String(b.year);
  return { query, valid };
}
