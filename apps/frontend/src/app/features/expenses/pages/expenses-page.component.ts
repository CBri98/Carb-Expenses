import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { apiErrorMessage } from '../../../core/services/api-error';
import { CategoryService } from '../../../core/services/category.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { LabelService } from '../../../core/services/label.service';
import { SettingsStore } from '../../../core/services/settings.store';
import { AppBreadcrumbComponent } from '../../../shared/components/app-breadcrumb.component';
import { CounterCardComponent, EmptyStateComponent, LoadingSkeletonComponent, PageHeaderComponent } from '../../../shared/components/catalog-display.components';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import type { ExpenseListItem, ExpenseListSummary, ExpenseQueryParams, ExpenseStatus, PaginationMeta } from '../../../shared/models/expense.models';
import { ExpenseFiltersComponent } from '../components/expense-filters.component';
import { ExpenseTableComponent, type ExpenseStatusAction } from '../components/expense-table.component';
import { PaginationComponent } from '../components/pagination.component';

interface Notice { type: 'success' | 'danger'; text: string; }

@Component({
  selector: 'app-expenses-page',
  standalone: true,
  imports: [
    AppBreadcrumbComponent,
    PageHeaderComponent, EmptyStateComponent, LoadingSkeletonComponent, ConfirmDialogComponent,
    ExpenseFiltersComponent, ExpenseTableComponent, PaginationComponent,
    CounterCardComponent,
  ],
  templateUrl: './expenses-page.component.html',
  styleUrl: './expenses-page.component.scss',
})
export class ExpensesPageComponent {
  private static readonly SHOW_FUTURE_STORAGE_KEY = 'carbexpenses.expenses.showFuture.v1';
  private static readonly FILTERS_STORAGE_KEY = 'carbexpenses.expenses.filters.v1';

  private readonly expensesService = inject(ExpenseService);
  private readonly categoriesService = inject(CategoryService);
  private readonly labelsService = inject(LabelService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly settings = inject(SettingsStore);
  private observedVersion = 0;

  readonly categories = this.categoriesService.categories;
  readonly labels = this.labelsService.labels;
  readonly defaultPageSize = computed(() => this.settings.experience().defaultPageSize);
  readonly showFuture = signal(this.readShowFuturePreference());
  readonly expenses = signal<ExpenseListItem[]>([]);
  readonly meta = signal<PaginationMeta>({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  readonly globalSummary = signal<ExpenseListSummary>({ totalResults: 0, completed: 0, planned: 0, cancelled: 0 });
  readonly filteredSummary = signal<ExpenseListSummary>({ totalResults: 0, completed: 0, planned: 0, cancelled: 0 });
  readonly query = signal<ExpenseQueryParams>({ page: 1, pageSize: 20 });
  readonly summaryFiltered = computed(() => hasExpenseSummaryFilters(this.effectiveQuery(this.query())));
  readonly loading = signal(true);
  readonly exporting = signal(false);
  readonly deleting = signal(false);
  readonly deleteTarget = signal<ExpenseListItem | null>(null);
  readonly notice = signal<Notice | null>(null);

  constructor() {
    this.settings.ensureLoaded();
    this.categoriesService.load({ sortBy: 'sortOrder', sortDirection: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.labelsService.load({ sortBy: 'sortOrder', sortDirection: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const experience = this.settings.experience();
      const remembered = experience.rememberExpenseFilters && params.keys.length === 0
        ? this.readRememberedFilters()
        : undefined;
      const query = queryFromParams(
        params,
        experience.defaultPageSize,
        remembered,
      );
      this.persistFilters(query);
      this.query.set(query);
      this.load(query);
    });
    effect(() => {
      const version = this.expensesService.changeVersion();
      if (version > this.observedVersion) {
        this.observedVersion = version;
        if (version > 0) this.load(this.query(), false);
      }
    });
  }

  applyFilters(filters: ExpenseQueryParams): void {
    void this.navigate({ ...filters, page: 1 });
  }

  goToPage(page: number): void {
    void this.navigate({ ...this.query(), page });
  }

  sortBy(field: ExpenseQueryParams['sortBy']): void {
    if (!field) return;
    const current = this.query();
    const next = { ...current, page: 1 };
    if (current.sortBy !== field) {
      next.sortBy = field;
      next.sortDirection = 'asc';
    } else if (current.sortDirection === 'asc') {
      next.sortDirection = 'desc';
    } else {
      delete next.sortBy;
      delete next.sortDirection;
    }
    void this.navigate(next);
  }

  filterByStatus(status?: ExpenseStatus): void {
    const next = { ...this.query(), page: 1 };
    delete next.status;
    delete next.statuses;
    if (status) next.statuses = [status];
    void this.navigate(next);
  }

  newExpense(): void {
    void this.router.navigate(['/expenses/new'], { queryParams: queryParams(this.query()) });
  }

  toggleFuture(event: Event): void {
    const show = (event.target as HTMLInputElement).checked;
    this.showFuture.set(show);
    if (isPlatformBrowser(this.platformId)) {
      try {
        window.localStorage.setItem(
          ExpensesPageComponent.SHOW_FUTURE_STORAGE_KEY,
          String(show),
        );
      } catch {
        // La preferenza in memoria resta attiva se lo storage non è disponibile.
      }
    }
    this.load(this.query());
  }

  viewExpense(expense: ExpenseListItem): void {
    void this.router.navigate(['/expenses', expense.id], { queryParams: queryParams(this.query()) });
  }

  editExpense(expense: ExpenseListItem): void {
    void this.router.navigate(['/expenses', expense.id, 'edit'], { queryParams: queryParams(this.query()) });
  }

  duplicateExpense(expense: ExpenseListItem): void {
    this.expensesService.duplicate(expense.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.success('Spesa duplicata correttamente.'),
      error: (error: unknown) => this.failure(error),
    });
  }

  updateStatus(action: ExpenseStatusAction): void {
    this.expensesService.setStatus(action.expense.id, action.status)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => this.success('Stato aggiornato.'),
        error: (error: unknown) => this.failure(error),
      });
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);
    this.expensesService.remove(target.id).pipe(
      finalize(() => this.deleting.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        this.notice.set({ type: 'success', text: 'Spesa eliminata.' });
        if (this.expenses().length === 1 && this.meta().page > 1) this.goToPage(this.meta().page - 1);
      },
      error: (error: unknown) => this.failure(error),
    });
  }

  exportCsv(): void {
    this.exporting.set(true);
    this.expensesService.exportCsv(this.effectiveQuery(this.query())).pipe(
      finalize(() => this.exporting.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ blob, filename }) => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        anchor.click();
        URL.revokeObjectURL(url);
        this.notice.set({ type: 'success', text: 'Esportazione CSV completata.' });
      },
      error: () => this.notice.set({ type: 'danger', text: 'Non è stato possibile esportare le spese.' }),
    });
  }

  private navigate(query: ExpenseQueryParams): Promise<boolean> {
    return this.router.navigate([], { relativeTo: this.route, queryParams: queryParams(query) });
  }

  private load(query: ExpenseQueryParams, showLoading = true): void {
    if (showLoading) this.loading.set(true);
    const effective = this.effectiveQuery(query);
    forkJoin({
      list: this.expensesService.list(effective),
      globalSummary: this.expensesService.summary({}),
      filteredSummary: this.expensesService.summary(effective),
    }).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ list, globalSummary, filteredSummary }) => {
        this.expenses.set(list.items);
        this.meta.set(list.meta);
        this.globalSummary.set(globalSummary);
        this.filteredSummary.set(filteredSummary);
      },
      error: (error: unknown) => this.failure(error),
    });
  }

  private effectiveQuery(query: ExpenseQueryParams): ExpenseQueryParams {
    return this.showFuture() ? query : { ...query, includeFuture: false };
  }

  private readShowFuturePreference(): boolean {
    if (!isPlatformBrowser(this.platformId)) return true;
    try {
      const stored = window.localStorage.getItem(
        ExpensesPageComponent.SHOW_FUTURE_STORAGE_KEY,
      );
      if (stored === 'true' || stored === 'false') return stored === 'true';
    } catch {
      // Mantiene il valore predefinito quando lo storage non è disponibile.
    }
    return true;
  }

  private readRememberedFilters(): ExpenseQueryParams | undefined {
    if (!isPlatformBrowser(this.platformId)) return undefined;
    try {
      const raw = window.localStorage.getItem(ExpensesPageComponent.FILTERS_STORAGE_KEY);
      if (!raw) return undefined;
      const value = JSON.parse(raw) as unknown;
      return typeof value === 'object' && value !== null
        ? sanitizeRememberedQuery(value as Record<string, unknown>)
        : undefined;
    } catch {
      return undefined;
    }
  }

  private persistFilters(query: ExpenseQueryParams): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      if (!this.settings.experience().rememberExpenseFilters) {
        window.localStorage.removeItem(ExpensesPageComponent.FILTERS_STORAGE_KEY);
        return;
      }
      const filters = { ...query };
      delete filters.page;
      window.localStorage.setItem(ExpensesPageComponent.FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // I query parameter restano la sorgente attiva se lo storage non è disponibile.
    }
  }

  private success(text: string): void {
    this.notice.set({ type: 'success', text });
  }

  private failure(error: unknown): void {
    this.notice.set({ type: 'danger', text: apiErrorMessage(error) });
  }
}

function hasExpenseSummaryFilters(query: ExpenseQueryParams): boolean {
  return Boolean(
    query.search
    || query.dateFrom
    || query.dateTo
    || query.month
    || query.year
    || query.categoryId
    || query.categoryIds?.length
    || query.labelIds?.length
    || query.status
    || query.statuses?.length
    || query.paymentMethod
    || query.paymentMethods?.length
    || query.recurrenceMode
    || query.minAmount
    || query.maxAmount
    || query.includeFuture === false
  );
}

function queryFromParams(
  params: ParamMap,
  defaultPageSize = 20,
  remembered: ExpenseQueryParams = {},
): ExpenseQueryParams {
  const query: ExpenseQueryParams = {
    ...remembered,
    page: positiveInt(params.get('page')) ?? 1,
    pageSize: positiveInt(params.get('pageSize')) ?? remembered.pageSize ?? defaultPageSize,
  };
  if (params.has('sortBy')) query.sortBy = sortField(params.get('sortBy'));
  if (params.has('sortDirection')) {
    query.sortDirection = params.get('sortDirection') === 'desc' ? 'desc' : 'asc';
  }
  for (const key of ['search', 'dateFrom', 'dateTo', 'categoryId', 'minAmount', 'maxAmount'] as const) {
    if (params.has(key)) {
      delete query[key];
      setString(query, key, params.get(key));
    }
  }
  if (params.has('month')) { delete query.month; query.month = positiveInt(params.get('month')); }
  if (params.has('year')) { delete query.year; query.year = positiveInt(params.get('year')); }
  if (params.has('labelIds')) query.labelIds = params.get('labelIds')?.split(',').filter(Boolean) ?? [];
  if (params.has('categoryIds')) {
    delete query.categoryId;
    query.categoryIds = csv(params.get('categoryIds'));
  }
  if (params.has('status')) {
    const status = params.get('status');
    if (status === 'COMPLETED' || status === 'PLANNED' || status === 'CANCELLED') query.status = status;
    else delete query.status;
  }
  if (params.has('paymentMethod')) {
    const payment = params.get('paymentMethod');
    if (payment && ['CASH','DEBIT_CARD','CREDIT_CARD','BANK_TRANSFER','DIRECT_DEBIT','DIGITAL_WALLET','CHECK','OTHER'].includes(payment)) query.paymentMethod = payment as ExpenseQueryParams['paymentMethod'];
    else delete query.paymentMethod;
  }
  if (params.has('statuses')) {
    delete query.status;
    query.statuses = csv(params.get('statuses')).filter(isExpenseStatus);
  }
  if (params.has('paymentMethods')) {
    delete query.paymentMethod;
    query.paymentMethods = csv(params.get('paymentMethods')).filter(isPaymentMethod);
  }
  if (params.has('recurrenceMode')) {
    const mode = params.get('recurrenceMode');
    if (mode === 'ALL' || mode === 'EXCLUDE' || mode === 'ONLY') query.recurrenceMode = mode;
    else delete query.recurrenceMode;
  }
  return query;
}

function sanitizeRememberedQuery(value: Record<string, unknown>): ExpenseQueryParams {
  const query: ExpenseQueryParams = {};
  if ([10, 20, 50, 100].includes(Number(value['pageSize']))) query.pageSize = Number(value['pageSize']);
  for (const key of ['search', 'dateFrom', 'dateTo', 'categoryId', 'minAmount', 'maxAmount'] as const) {
    if (typeof value[key] === 'string') query[key] = value[key];
  }
  if (Number.isInteger(value['month']) && Number(value['month']) >= 1 && Number(value['month']) <= 12) query.month = Number(value['month']);
  if (Number.isInteger(value['year']) && Number(value['year']) >= 2000 && Number(value['year']) <= 2100) query.year = Number(value['year']);
  if (Array.isArray(value['labelIds'])) query.labelIds = value['labelIds'].filter((item): item is string => typeof item === 'string');
  if (Array.isArray(value['categoryIds'])) query.categoryIds = stringArray(value['categoryIds']);
  if (Array.isArray(value['statuses'])) query.statuses = stringArray(value['statuses']).filter(isExpenseStatus);
  if (Array.isArray(value['paymentMethods'])) query.paymentMethods = stringArray(value['paymentMethods']).filter(isPaymentMethod);
  const status = value['status'];
  if (status === 'COMPLETED' || status === 'PLANNED' || status === 'CANCELLED') query.status = status;
  const payment = value['paymentMethod'];
  if (typeof payment === 'string' && ['CASH','DEBIT_CARD','CREDIT_CARD','BANK_TRANSFER','DIRECT_DEBIT','DIGITAL_WALLET','CHECK','OTHER'].includes(payment)) query.paymentMethod = payment as ExpenseQueryParams['paymentMethod'];
  const recurrenceMode = value['recurrenceMode'];
  if (recurrenceMode === 'ALL' || recurrenceMode === 'EXCLUDE' || recurrenceMode === 'ONLY') query.recurrenceMode = recurrenceMode;
  const sort = value['sortBy'];
  if (typeof sort === 'string' && ['expenseDate','amount','description','createdAt','updatedAt'].includes(sort)) query.sortBy = sort as ExpenseQueryParams['sortBy'];
  if (value['sortDirection'] === 'asc' || value['sortDirection'] === 'desc') query.sortDirection = value['sortDirection'];
  return query;
}

function queryParams(query: ExpenseQueryParams): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) continue;
    result[key] = Array.isArray(value) ? value.join(',') : value;
  }
  return result;
}

function setString(query: ExpenseQueryParams, key: 'search' | 'dateFrom' | 'dateTo' | 'categoryId' | 'minAmount' | 'maxAmount', value: string | null): void {
  if (value) query[key] = value;
}

function positiveInt(value: string | null): number | undefined {
  const number = value ? Number(value) : NaN;
  return Number.isInteger(number) && number > 0 ? number : undefined;
}

function sortField(value: string | null): ExpenseQueryParams['sortBy'] {
  return value && ['expenseDate','amount','description','createdAt','updatedAt'].includes(value)
    ? (value as ExpenseQueryParams['sortBy']) : undefined;
}

function csv(value: string | null): string[] {
  return value?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
}

function stringArray(value: unknown[]): string[] {
  return value.filter((item): item is string => typeof item === 'string');
}

function isExpenseStatus(value: string): value is NonNullable<ExpenseQueryParams['status']> {
  return value === 'COMPLETED' || value === 'PLANNED' || value === 'CANCELLED';
}

function isPaymentMethod(value: string): value is NonNullable<ExpenseQueryParams['paymentMethod']> {
  return ['CASH','DEBIT_CARD','CREDIT_CARD','BANK_TRANSFER','DIRECT_DEBIT','DIGITAL_WALLET','CHECK','OTHER'].includes(value);
}
