import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { NgSelectComponent } from '@ng-select/ng-select';
import { debounceTime, distinctUntilChanged, finalize, forkJoin, map, Subject } from 'rxjs';

import { apiErrorMessage } from '../../core/services/api-error';
import { CategoryService } from '../../core/services/category.service';
import { RecurrenceService } from '../../core/services/recurrence.service';
import { SettingsStore } from '../../core/services/settings.store';
import {
  EmptyStateComponent,
  LoadingSkeletonComponent,
  PageHeaderComponent,
} from '../../shared/components/catalog-display.components';
import { EuroAmountPipe, ItalianExpenseDatePipe } from '../../shared/components/expense-display.components';
import { FilterPanelComponent } from '../../shared/components/filter-panel.component';
import type { PaginationMeta } from '../../shared/models/expense.models';
import {
  RECURRENCE_FREQUENCIES,
  RECURRENCE_STATUSES,
  type RecurrenceQueryParams,
  type RecurrenceRule,
  type RecurrenceSummary,
} from '../../shared/models/recurrence.models';
import { PaginationComponent } from '../expenses/components/pagination.component';
import {
  RecurrenceFrequencyPipe,
  RecurrenceStatusBadgeComponent,
} from './recurrence-display.components';
import { RecurrenceActionsMenuComponent } from './recurrence-actions-menu.component';

@Component({
  selector: 'app-recurrences-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    NgSelectComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    PaginationComponent,
    EuroAmountPipe,
    ItalianExpenseDatePipe,
    RecurrenceFrequencyPipe,
    RecurrenceStatusBadgeComponent,
    FilterPanelComponent,
    RecurrenceActionsMenuComponent,
  ],
  templateUrl: './recurrences-page.component.html',
  styleUrl: './recurrences-page.component.scss',
})
export class RecurrencesPageComponent {
  private readonly service = inject(RecurrenceService);
  private readonly categoriesService = inject(CategoryService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly settings = inject(SettingsStore);
  private readonly searchChanges = new Subject<string>();

  readonly items = signal<RecurrenceRule[]>([]);
  readonly meta = signal<PaginationMeta>({ page: 1, pageSize: 20, totalItems: 0, totalPages: 0 });
  readonly summary = signal<RecurrenceSummary | null>(null);
  readonly loading = signal(true);
  readonly busyId = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly cancelTarget = signal<RecurrenceRule | null>(null);
  readonly cancelFuture = signal(false);
  readonly categories = this.categoriesService.categories;
  readonly statuses = RECURRENCE_STATUSES;
  readonly frequencies = RECURRENCE_FREQUENCIES;
  readonly query = signal<RecurrenceQueryParams>({});
  readonly searchDraft = signal('');
  readonly filtersExpanded = signal(false);
  readonly filters = this.fb.nonNullable.group({
    status: [''],
    frequency: [''],
    categoryId: [''],
  });

  constructor() {
    this.settings.ensureLoaded();
    this.searchChanges.pipe(
      map((value) => value.trim().replace(/\s+/g, ' ').slice(0, 150)),
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((search) => {
      if (search !== (this.query().search ?? '')) {
        void this.navigate({ ...this.query(), page: 1, search: search || undefined });
      }
    });
    this.filters.valueChanges.pipe(
      debounceTime(150),
      distinctUntilChanged((left, right) => JSON.stringify(left) === JSON.stringify(right)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.applyStructuredFilters());
    this.categoriesService.load({ sortBy: 'sortOrder', sortDirection: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const query = fromParams(params, this.settings.experience().defaultPageSize);
      this.query.set(query);
      this.searchDraft.set(query.search ?? '');
      this.filters.patchValue({
        status: query.status ?? '',
        frequency: query.frequency ?? '',
        categoryId: query.categoryId ?? '',
      }, { emitEvent: false });
      this.load(query);
    });
  }

  updateSearch(value: string): void {
    this.searchDraft.set(value);
    this.searchChanges.next(value);
  }

  resetFilters(): void {
    this.searchDraft.set('');
    this.filters.reset({ status: '', frequency: '', categoryId: '' }, { emitEvent: false });
    void this.navigate({ page: 1, pageSize: this.settings.experience().defaultPageSize });
  }

  activeFilterCount(): number {
    const value = this.filters.getRawValue();
    return [value.status, value.frequency, value.categoryId].filter(Boolean).length;
  }

  filterSummary(): string {
    const value = this.filters.getRawValue();
    const parts = [
      value.status ? this.statuses.find((item) => item.value === value.status)?.label : null,
      value.frequency ? this.frequencies.find((item) => item.value === value.frequency)?.label : null,
      value.categoryId ? this.categories().find((item) => item.id === value.categoryId)?.name : null,
    ].filter((item): item is string => Boolean(item));
    return parts.length ? parts.join(' · ') : 'Nessun filtro strutturato applicato';
  }

  sort(column: NonNullable<RecurrenceQueryParams['sortBy']>): void {
    const query = this.query();
    const next = query.sortBy !== column
      ? 'asc'
      : query.sortDirection === 'asc'
        ? 'desc'
        : undefined;
    void this.navigate({
      ...query,
      page: 1,
      sortBy: next ? column : undefined,
      sortDirection: next,
    });
  }

  ariaSort(column: NonNullable<RecurrenceQueryParams['sortBy']>): 'ascending' | 'descending' | 'none' {
    if (this.query().sortBy !== column) return 'none';
    return this.query().sortDirection === 'desc' ? 'descending' : 'ascending';
  }

  sortIcon(column: NonNullable<RecurrenceQueryParams['sortBy']>): string {
    if (this.query().sortBy !== column) return 'bi-arrow-down-up';
    return this.query().sortDirection === 'desc' ? 'bi-sort-down' : 'bi-sort-up';
  }

  openRule(rule: RecurrenceRule): void {
    void this.router.navigate(['/recurrences', rule.id]);
  }

  edit(rule: RecurrenceRule): void {
    void this.router.navigate(['/recurrences', rule.id, 'edit']);
  }

  goToPage(page: number): void {
    void this.navigate({ ...this.query(), page });
  }

  pause(rule: RecurrenceRule): void {
    if (!window.confirm('La ricorrenza verrà sospesa e non genererà nuove spese. Continuare?')) return;
    this.action(rule, this.service.pause(rule.id), 'Ricorrenza sospesa.');
  }

  resume(rule: RecurrenceRule): void {
    if (!window.confirm('La ricorrenza riprenderà dalla prossima data futura disponibile. Continuare?')) return;
    this.action(rule, this.service.resume(rule.id), 'Ricorrenza riattivata.');
  }

  openCancel(rule: RecurrenceRule): void {
    this.cancelFuture.set(false);
    this.cancelTarget.set(rule);
  }

  confirmCancel(): void {
    const rule = this.cancelTarget();
    if (!rule) return;
    this.action(
      rule,
      this.service.cancel(rule.id, this.cancelFuture()),
      'Ricorrenza terminata.',
      () => this.cancelTarget.set(null),
    );
  }

  remove(rule: RecurrenceRule): void {
    if (!window.confirm('Eliminare questa ricorrenza mai utilizzata?')) return;
    this.busyId.set(rule.id);
    this.service.remove(rule.id).pipe(
      finalize(() => this.busyId.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.notice.set('Ricorrenza eliminata.');
        this.load(this.query(), false);
      },
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }

  private action(
    rule: RecurrenceRule,
    request: ReturnType<RecurrenceService['pause']>,
    message: string,
    done?: () => void,
  ): void {
    this.busyId.set(rule.id);
    request.pipe(
      finalize(() => this.busyId.set(null)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        done?.();
        this.notice.set(message);
        this.load(this.query(), false);
      },
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }

  load(query: RecurrenceQueryParams, showLoading = true): void {
    if (showLoading) this.loading.set(true);
    this.error.set(null);
    forkJoin({ list: this.service.list(query), summary: this.service.summary() }).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ list, summary }) => {
        this.items.set(list.items);
        this.meta.set(list.meta);
        this.summary.set(summary);
      },
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }

  private navigate(query: RecurrenceQueryParams): Promise<boolean> {
    return this.router.navigate([], {
      relativeTo: this.route,
      queryParams: cleanParams(query),
    });
  }

  private applyStructuredFilters(): void {
    const value = this.filters.getRawValue();
    const current = this.query();
    const next: RecurrenceQueryParams = {
      ...current,
      page: 1,
      status: recurrenceStatus(value.status),
      frequency: recurrenceFrequency(value.frequency),
      categoryId: value.categoryId || undefined,
    };
    if (JSON.stringify(cleanParams(next)) !== JSON.stringify(cleanParams(current))) {
      void this.navigate(next);
    }
  }
}

function fromParams(params: ParamMap, defaultPageSize = 20): RecurrenceQueryParams {
  return {
    page: positive(params.get('page')) ?? 1,
    pageSize: positive(params.get('pageSize')) ?? defaultPageSize,
    search: params.get('search') || undefined,
    status: recurrenceStatus(params.get('status')),
    frequency: recurrenceFrequency(params.get('frequency')),
    categoryId: params.get('categoryId') || undefined,
    sortBy: recurrenceSort(params.get('sortBy')),
    sortDirection: recurrenceSort(params.get('sortBy'))
      ? params.get('sortDirection') === 'desc' ? 'desc' : 'asc'
      : undefined,
  };
}

function recurrenceStatus(value: string | null) {
  return value && ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'].includes(value)
    ? value as RecurrenceQueryParams['status']
    : undefined;
}

function recurrenceFrequency(value: string | null) {
  return value && ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(value)
    ? value as RecurrenceQueryParams['frequency']
    : undefined;
}

function positive(value: string | null): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function recurrenceSort(value: string | null): RecurrenceQueryParams['sortBy'] {
  return value && ['nextOccurrenceDate', 'name', 'amount', 'createdAt', 'updatedAt'].includes(value)
    ? value as RecurrenceQueryParams['sortBy']
    : undefined;
}

function cleanParams(query: RecurrenceQueryParams): Record<string, string | number> {
  const params: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params[key] = value;
  }
  return params;
}
