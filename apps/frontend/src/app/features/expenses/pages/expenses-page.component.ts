import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { apiErrorMessage } from '../../../core/services/api-error';
import { CategoryService } from '../../../core/services/category.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { LabelService } from '../../../core/services/label.service';
import { EmptyStateComponent, LoadingSkeletonComponent, PageHeaderComponent } from '../../../shared/components/catalog-display.components';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import type { ExpenseListItem, ExpenseQueryParams, PaginationMeta } from '../../../shared/models/expense.models';
import { ExpenseFiltersComponent } from '../components/expense-filters.component';
import { ExpenseTableComponent, type ExpenseStatusAction } from '../components/expense-table.component';
import { PaginationComponent } from '../components/pagination.component';

interface Notice { type: 'success' | 'danger'; text: string; }

@Component({
  selector: 'app-expenses-page',
  standalone: true,
  imports: [
    PageHeaderComponent, EmptyStateComponent, LoadingSkeletonComponent, ConfirmDialogComponent,
    ExpenseFiltersComponent, ExpenseTableComponent, PaginationComponent,
  ],
  templateUrl: './expenses-page.component.html',
  styleUrl: './expenses-page.component.scss',
})
export class ExpensesPageComponent {
  private static readonly SHOW_FUTURE_STORAGE_KEY = 'carbexpenses.expenses.showFuture.v1';

  private readonly expensesService = inject(ExpenseService);
  private readonly categoriesService = inject(CategoryService);
  private readonly labelsService = inject(LabelService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private observedVersion = 0;

  readonly categories = this.categoriesService.categories;
  readonly labels = this.labelsService.labels;
  readonly showFuture = signal(this.readShowFuturePreference());
  readonly expenses = signal<ExpenseListItem[]>([]);
  readonly meta = signal<PaginationMeta>({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  readonly query = signal<ExpenseQueryParams>({ page: 1, pageSize: 20, sortBy: 'expenseDate', sortDirection: 'desc' });
  readonly loading = signal(true);
  readonly exporting = signal(false);
  readonly deleting = signal(false);
  readonly deleteTarget = signal<ExpenseListItem | null>(null);
  readonly notice = signal<Notice | null>(null);

  constructor() {
    this.categoriesService.load({ sortBy: 'sortOrder', sortDirection: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.labelsService.load({ sortBy: 'sortOrder', sortDirection: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const query = queryFromParams(params);
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
    const direction = current.sortBy === field && current.sortDirection === 'asc' ? 'desc' : 'asc';
    void this.navigate({ ...current, page: 1, sortBy: field, sortDirection: direction });
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
    this.expensesService.list(this.effectiveQuery(query)).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (result) => { this.expenses.set(result.items); this.meta.set(result.meta); },
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

  private success(text: string): void {
    this.notice.set({ type: 'success', text });
  }

  private failure(error: unknown): void {
    this.notice.set({ type: 'danger', text: apiErrorMessage(error) });
  }
}

function queryFromParams(params: ParamMap): ExpenseQueryParams {
  const query: ExpenseQueryParams = {
    page: positiveInt(params.get('page')) ?? 1,
    pageSize: positiveInt(params.get('pageSize')) ?? 20,
    sortBy: sortField(params.get('sortBy')),
    sortDirection: params.get('sortDirection') === 'asc' ? 'asc' : 'desc',
  };
  setString(query, 'search', params.get('search'));
  setString(query, 'dateFrom', params.get('dateFrom'));
  setString(query, 'dateTo', params.get('dateTo'));
  setString(query, 'categoryId', params.get('categoryId'));
  setString(query, 'minAmount', params.get('minAmount'));
  setString(query, 'maxAmount', params.get('maxAmount'));
  query.month = positiveInt(params.get('month'));
  query.year = positiveInt(params.get('year'));
  const labelIds = params.get('labelIds')?.split(',').filter(Boolean);
  if (labelIds?.length) query.labelIds = labelIds;
  const status = params.get('status');
  if (status === 'COMPLETED' || status === 'PLANNED' || status === 'CANCELLED') query.status = status;
  const payment = params.get('paymentMethod');
  if (payment && ['CASH','DEBIT_CARD','CREDIT_CARD','BANK_TRANSFER','DIRECT_DEBIT','DIGITAL_WALLET','CHECK','OTHER'].includes(payment)) {
    query.paymentMethod = payment as ExpenseQueryParams['paymentMethod'];
  }
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
    ? (value as ExpenseQueryParams['sortBy']) : 'expenseDate';
}
