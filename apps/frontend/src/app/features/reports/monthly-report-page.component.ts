import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, type ParamMap, Router, RouterLink } from '@angular/router';
import {
  catchError,
  combineLatest,
  EMPTY,
  finalize,
  forkJoin,
  startWith,
  Subject,
  switchMap,
  tap,
} from 'rxjs';

import { CategoryService } from '../../core/services/category.service';
import { ExpenseService } from '../../core/services/expense.service';
import { LabelService } from '../../core/services/label.service';
import { apiErrorMessage } from '../../core/services/api-error';
import { ReportsService } from '../../core/services/reports.service';
import { SettingsStore } from '../../core/services/settings.store';
import {
  EmptyStateComponent,
  LoadingSkeletonComponent,
} from '../../shared/components/catalog-display.components';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { EuroAmountPipe, ItalianExpenseDatePipe } from '../../shared/components/expense-display.components';
import {
  EXPENSE_STATUSES,
  PAYMENT_METHODS,
  type ExpenseListItem,
  type ExpenseQueryParams,
  type ExpenseStatus,
  type PaginationMeta,
  type PaymentMethod,
} from '../../shared/models/expense.models';
import type {
  MonthlyExpensesQuery,
  MonthlyReport,
  MonthlyReportQuery,
} from '../../shared/models/report.models';
import { shiftDashboardPeriod } from '../../shared/utilities/dashboard-format';
import { formatEuroAmount, paymentMethodLabel } from '../../shared/utilities/expense-format';
import {
  currentReportPeriod,
  percentageLabel,
  reportPeriodFromParams,
} from '../../shared/utilities/report-format';
import { DashboardChartComponent, type DashboardChartSelection } from '../dashboard/dashboard-chart.component';
import { StatCardComponent } from '../dashboard/stat-card.component';
import {
  ExpenseTableComponent,
  type ExpenseStatusAction,
} from '../expenses/components/expense-table.component';
import { PaginationComponent } from '../expenses/components/pagination.component';
import { MonthSelectorComponent } from './month-selector.component';
import { PaymentMethodBreakdownComponent } from './payment-method-breakdown.component';

@Component({
  selector: 'app-monthly-report-page',
  standalone: true,
  imports: [
    RouterLink,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    ConfirmDialogComponent,
    EuroAmountPipe,
    ItalianExpenseDatePipe,
    DashboardChartComponent,
    StatCardComponent,
    ExpenseTableComponent,
    PaginationComponent,
    MonthSelectorComponent,
    PaymentMethodBreakdownComponent,
  ],
  templateUrl: './monthly-report-page.component.html',
  styleUrl: './reports.scss',
})
export class MonthlyReportPageComponent {
  private readonly reports = inject(ReportsService);
  private readonly expenseService = inject(ExpenseService);
  private readonly categoriesService = inject(CategoryService);
  private readonly labelsService = inject(LabelService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly settings = inject(SettingsStore);
  private readonly refresh = new Subject<void>();
  private readonly today = currentReportPeriod();
  private observedExpenseVersion = 0;

  readonly categories = this.categoriesService.categories;
  readonly labels = this.labelsService.labels;
  readonly statuses = EXPENSE_STATUSES;
  readonly paymentMethods = PAYMENT_METHODS;
  readonly selected = signal<MonthlyReportQuery>(this.today);
  readonly filters = signal<ExpenseQueryParams>(defaultFilters(this.settings.experience().defaultPageSize));
  readonly report = signal<MonthlyReport | null>(null);
  readonly expenses = signal<ExpenseListItem[]>([]);
  readonly meta = signal<PaginationMeta>(emptyMeta());
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly deleteTarget = signal<ExpenseListItem | null>(null);
  readonly deleting = signal(false);

  readonly dailyLabels = computed(() => this.report()?.dailyTrend.map((point) => String(point.day)) ?? []);
  readonly dailyCompleted = computed(() => this.report()?.dailyTrend.map((point) => Number(point.completedTotal)) ?? []);
  readonly dailyPlanned = computed(() => this.report()?.dailyTrend.map((point) => Number(point.plannedTotal)) ?? []);
  readonly dailyCompletedCounts = computed(() => this.report()?.dailyTrend.map((point) => point.completedCount) ?? []);
  readonly dailyPlannedCounts = computed(() => this.report()?.dailyTrend.map((point) => point.plannedCount) ?? []);
  readonly categoryLabels = computed(() => this.report()?.categoryDistribution.map((item) => item.name) ?? []);
  readonly categoryValues = computed(() => this.report()?.categoryDistribution.map((item) => Number(item.total)) ?? []);
  readonly categoryCounts = computed(() => this.report()?.categoryDistribution.map((item) => item.expenseCount) ?? []);
  readonly categoryColors = computed(() => this.report()?.categoryDistribution.map((item) => item.color) ?? []);
  readonly dailyDescription = computed(() => {
    const report = this.report();
    if (!report) return '';
    return `Completate ${formatEuroAmount(report.summary.completedTotal)}; pianificate ${formatEuroAmount(report.summary.plannedTotal)}.`;
  });
  readonly categoryDescription = computed(() => {
    const top = this.report()?.topCategory;
    return top ? `${top.name} guida il mese con ${formatEuroAmount(top.total)} (${top.percentage}%).` : 'Nessuna categoria con spese completate.';
  });

  constructor() {
    this.settings.ensureLoaded();
    this.categoriesService
      .load({ sortBy: 'sortOrder', sortDirection: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
    this.labelsService
      .load({ sortBy: 'sortOrder', sortDirection: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    combineLatest([this.route.queryParamMap, this.refresh.pipe(startWith(undefined))])
      .pipe(
        switchMap(([params]) => {
          const parsed = parseMonthlyState(params, this.today, this.settings.experience().defaultPageSize);
          if (!parsed.valid) {
            void this.navigate(parsed.period, parsed.filters, true);
            return EMPTY;
          }
          this.selected.set(parsed.period);
          this.filters.set(parsed.filters);
          this.loading.set(true);
          this.error.set(null);
          const listQuery: MonthlyExpensesQuery = {
            ...parsed.filters,
            month: parsed.period.month,
            year: parsed.period.year,
          };
          return forkJoin({
            report: this.reports.monthly(parsed.period),
            expenses: this.reports.monthlyExpenses(listQuery),
          }).pipe(
            tap(({ report, expenses }) => {
              this.report.set(report);
              this.expenses.set(expenses.items);
              this.meta.set(expenses.meta);
            }),
            catchError(() => {
              this.error.set('Non è stato possibile caricare il report mensile. Riprova tra poco.');
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    effect(() => {
      const version = this.expenseService.changeVersion();
      if (version > this.observedExpenseVersion) {
        this.observedExpenseVersion = version;
        if (version > 0) this.refresh.next();
      }
    });
  }

  previousMonth(): void {
    this.changePeriod(shiftDashboardPeriod(this.selected().month, this.selected().year, -1));
  }
  nextMonth(): void {
    this.changePeriod(shiftDashboardPeriod(this.selected().month, this.selected().year, 1));
  }
  currentMonth(): void { this.changePeriod(this.today); }
  changePeriod(period: MonthlyReportQuery): void {
    void this.navigate(period, { ...this.filters(), page: 1 });
  }
  retry(): void { this.refresh.next(); }

  compareQuery(): Record<string, number> {
    const previous = shiftDashboardPeriod(this.selected().month, this.selected().year, -1);
    return {
      monthA: previous.month,
      yearA: previous.year,
      monthB: this.selected().month,
      yearB: this.selected().year,
    };
  }

  updateFilter(
    key: 'search' | 'categoryId' | 'status' | 'paymentMethod' | 'pageSize',
    event: Event,
  ): void {
    const value = (event.target as HTMLInputElement | HTMLSelectElement).value;
    const current = { ...this.filters(), page: 1 };
    if (key === 'pageSize') current.pageSize = Number(value);
    else if (value) setFilter(current, key, value);
    else delete current[key];
    void this.navigate(this.selected(), current);
  }

  updateLabels(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const labelIds = [...select.selectedOptions].map((option) => option.value);
    const next = { ...this.filters(), page: 1 };
    if (labelIds.length) next.labelIds = labelIds;
    else delete next.labelIds;
    void this.navigate(this.selected(), next);
  }

  resetFilters(): void { void this.navigate(this.selected(), defaultFilters()); }
  goToPage(page: number): void {
    void this.navigate(this.selected(), { ...this.filters(), page });
  }
  sortBy(sortBy: ExpenseQueryParams['sortBy']): void {
    if (!sortBy) return;
    const current = this.filters();
    const sortDirection =
      current.sortBy === sortBy && current.sortDirection === 'asc' ? 'desc' : 'asc';
    void this.navigate(this.selected(), { ...current, page: 1, sortBy, sortDirection });
  }

  isLabelSelected(id: string): boolean { return this.filters().labelIds?.includes(id) ?? false; }
  euro(value: string): string { return formatEuroAmount(value); }
  paymentLabel(method: PaymentMethod): string { return paymentMethodLabel(method); }
  percentage(value: number | null): string { return percentageLabel(value); }

  openTopCategory(): void {
    const category = this.report()?.topCategory;
    if (category) this.navigateToExpenses({ categoryIds: [category.categoryId], statuses: ['COMPLETED'] });
  }

  openHighestExpense(): void {
    const expense = this.report()?.highestExpense;
    if (expense) void this.router.navigate(['/expenses', expense.id]);
  }

  openDailyPoint(selection: DashboardChartSelection): void {
    const point = this.report()?.dailyTrend[selection.index];
    if (!point) return;
    this.navigateToExpenses({
      dateFrom: point.date,
      dateTo: point.date,
      statuses: [selection.datasetIndex === 0 ? 'COMPLETED' : 'PLANNED'],
    });
  }

  openCategoryPoint(selection: DashboardChartSelection): void {
    const category = this.report()?.categoryDistribution[selection.index];
    if (category) this.navigateToExpenses({ categoryIds: [category.categoryId], statuses: ['COMPLETED'] });
  }

  openPaymentMethod(paymentMethod: PaymentMethod): void {
    this.navigateToExpenses({ paymentMethods: [paymentMethod], statuses: ['COMPLETED'] });
  }

  view(expense: ExpenseListItem): void {
    void this.router.navigate(['/expenses', expense.id]);
  }
  edit(expense: ExpenseListItem): void {
    void this.router.navigate(['/expenses', expense.id, 'edit']);
  }
  duplicate(expense: ExpenseListItem): void {
    this.expenseService
      .duplicate(expense.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.notice.set('Spesa duplicata correttamente.'),
        error: (error: unknown) => this.notice.set(apiErrorMessage(error)),
      });
  }
  changeStatus(action: ExpenseStatusAction): void {
    this.expenseService
      .setStatus(action.expense.id, action.status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.notice.set('Stato aggiornato.'),
        error: (error: unknown) => this.notice.set(apiErrorMessage(error)),
      });
  }
  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);
    this.expenseService
      .remove(target.id)
      .pipe(
        finalize(() => this.deleting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.notice.set('Spesa eliminata.');
        },
        error: (error: unknown) => this.notice.set(apiErrorMessage(error)),
      });
  }

  private navigate(
    period: MonthlyReportQuery,
    filters: ExpenseQueryParams,
    replaceUrl = false,
  ): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams(period, filters),
      replaceUrl,
    });
  }

  private navigateToExpenses(filters: ExpenseQueryParams): void {
    void this.router.navigate(['/expenses'], { queryParams: queryParams(this.selected(), filters) });
  }
}

function parseMonthlyState(
  params: ParamMap,
  fallback: MonthlyReportQuery,
  defaultPageSize = 20,
): { period: MonthlyReportQuery; filters: ExpenseQueryParams; valid: boolean } {
  const period = reportPeriodFromParams(params.get('month'), params.get('year'), fallback);
  const valid =
    String(period.month) === params.get('month') && String(period.year) === params.get('year');
  const filters = defaultFilters(defaultPageSize);
  filters.page = positiveInt(params.get('page')) ?? 1;
  filters.pageSize = Math.min(100, positiveInt(params.get('pageSize')) ?? defaultPageSize);
  filters.search = params.get('search') || undefined;
  filters.categoryId = params.get('categoryId') || undefined;
  filters.labelIds = params.get('labelIds')?.split(',').filter(Boolean);
  const status = params.get('status');
  if (status === 'COMPLETED' || status === 'PLANNED' || status === 'CANCELLED') {
    filters.status = status;
  }
  const payment = params.get('paymentMethod');
  if (PAYMENT_METHODS.some((item) => item.value === payment)) {
    filters.paymentMethod = payment as PaymentMethod;
  }
  const sort = params.get('sortBy');
  if (sort && ['expenseDate', 'amount', 'description', 'createdAt', 'updatedAt'].includes(sort)) {
    filters.sortBy = sort as ExpenseQueryParams['sortBy'];
  }
  filters.sortDirection = params.get('sortDirection') === 'asc' ? 'asc' : 'desc';
  return { period, filters, valid };
}

function queryParams(
  period: MonthlyReportQuery,
  filters: ExpenseQueryParams,
): Record<string, string | number> {
  const result: Record<string, string | number> = { month: period.month, year: period.year };
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) continue;
    result[key] = Array.isArray(value) ? value.join(',') : value;
  }
  return result;
}

function defaultFilters(defaultPageSize = 20): ExpenseQueryParams {
  return { page: 1, pageSize: defaultPageSize, sortBy: 'expenseDate', sortDirection: 'desc' };
}
function emptyMeta(): PaginationMeta {
  return { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 };
}
function positiveInt(value: string | null): number | undefined {
  const parsed = value ? Number(value) : NaN;
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}
function setFilter(
  filters: ExpenseQueryParams,
  key: 'search' | 'categoryId' | 'status' | 'paymentMethod',
  value: string,
): void {
  if (key === 'status') filters.status = value as ExpenseStatus;
  else if (key === 'paymentMethod') filters.paymentMethod = value as PaymentMethod;
  else filters[key] = value;
}
