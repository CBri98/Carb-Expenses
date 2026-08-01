import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import {
  NgLabelTemplateDirective,
  NgOptionTemplateDirective,
  NgSelectComponent,
} from '@ng-select/ng-select';
import { debounceTime, distinctUntilChanged, finalize, forkJoin, map, type Observable, Subject } from 'rxjs';

import { apiErrorMessage } from '../../core/services/api-error';
import { CategoryService } from '../../core/services/category.service';
import { RecurrenceService } from '../../core/services/recurrence.service';
import { ReminderManagementService } from '../../core/services/reminder-management.service';
import { SettingsStore } from '../../core/services/settings.store';
import { ToastService } from '../../core/services/toast.service';
import { AppBreadcrumbComponent } from '../../shared/components/app-breadcrumb.component';
import {
  CategoryBadgeComponent,
  CounterCardComponent,
  EmptyStateComponent,
  LoadingSkeletonComponent,
  PageHeaderComponent,
} from '../../shared/components/catalog-display.components';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import {
  EuroAmountPipe,
  ExpenseStatusBadgeComponent,
  ItalianDateTimePipe,
  ItalianExpenseDatePipe,
} from '../../shared/components/expense-display.components';
import { FilterPanelComponent } from '../../shared/components/filter-panel.component';
import type { ExpenseReminder, ReminderDraft, ReminderType } from '../../shared/models/notification.models';
import type { ExpenseStatus, PaginationMeta } from '../../shared/models/expense.models';
import {
  REMINDER_SOURCES,
  REMINDER_STATUSES,
  REMINDER_TYPES,
  type ManagedReminder,
  type ReminderQueryParams,
  type ReminderSort,
  type ReminderSource,
  type ReminderStatus,
  type ReminderSummary,
} from '../../shared/models/reminder-management.models';
import type { RecurrenceRule } from '../../shared/models/recurrence.models';
import { isoToRomeLocalInput, romeLocalDateTimeToIso } from '../../shared/utilities/notification-date';
import { ExpenseReminderFormComponent } from '../expenses/components/expense-reminder-form.component';
import { PaginationComponent } from '../expenses/components/pagination.component';
import {
  ReminderSourceComponent,
  ReminderStatusBadgeComponent,
  ReminderTypeBadgeComponent,
} from './reminder-display.components';

const EMPTY_META: PaginationMeta = { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 };
type ReminderAction = 'cancel' | 'reactivate' | 'delete';

@Component({
  selector: 'app-reminders-page',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    NgSelectComponent,
    NgOptionTemplateDirective,
    NgLabelTemplateDirective,
    AppBreadcrumbComponent,
    PageHeaderComponent,
    CategoryBadgeComponent,
    CounterCardComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    ConfirmDialogComponent,
    FilterPanelComponent,
    PaginationComponent,
    ExpenseReminderFormComponent,
    ExpenseStatusBadgeComponent,
    ReminderStatusBadgeComponent,
    ReminderSourceComponent,
    ReminderTypeBadgeComponent,
    EuroAmountPipe,
    ItalianDateTimePipe,
    ItalianExpenseDatePipe,
  ],
  templateUrl: './reminders-page.component.html',
  styleUrl: './reminders-page.component.scss',
})
export class RemindersPageComponent {
  private readonly service = inject(ReminderManagementService);
  private readonly categoriesService = inject(CategoryService);
  private readonly recurrencesService = inject(RecurrenceService);
  readonly settings = inject(SettingsStore);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchChanges = new Subject<string>();

  readonly items = signal<ManagedReminder[]>([]);
  readonly meta = signal<PaginationMeta>(EMPTY_META);
  readonly summary = signal<ReminderSummary | null>(null);
  readonly recurrences = signal<RecurrenceRule[]>([]);
  readonly query = signal<ReminderQueryParams>({});
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchDraft = signal('');
  readonly filtersExpanded = signal(false);
  readonly selected = signal<ReadonlySet<string>>(new Set());
  readonly confirmAction = signal<ReminderAction | null>(null);
  readonly confirmTarget = signal<ManagedReminder | null>(null);
  readonly editTarget = signal<ManagedReminder | null>(null);
  readonly editDraft = signal<ReminderDraft | null>(null);
  readonly editFormValid = signal(false);
  readonly editResetVersion = signal(0);
  readonly editReminders = computed<ExpenseReminder[]>(() => {
    const item = this.editTarget();
    return item ? [toExpenseReminder(item)] : [];
  });

  readonly categories = this.categoriesService.categories;
  readonly statuses = REMINDER_STATUSES;
  readonly types = REMINDER_TYPES;
  readonly sources = REMINDER_SOURCES;
  readonly expenseStatuses: ReadonlyArray<{ value: ExpenseStatus; label: string; icon: string }> = [
    { value: 'PLANNED', label: 'Pianificata', icon: 'bi-clock' },
    { value: 'COMPLETED', label: 'Completata', icon: 'bi-check-circle' },
    { value: 'CANCELLED', label: 'Annullata', icon: 'bi-x-circle' },
  ];

  readonly filters = this.fb.nonNullable.group({
    status: [''],
    type: [''],
    source: [''],
    expenseStatus: [''],
    categoryId: [''],
    recurrenceRuleId: [''],
    scheduledFrom: [''],
    scheduledTo: [''],
    expenseDateFrom: [''],
    expenseDateTo: [''],
  });

  readonly allPageSelected = computed(() =>
    this.items().length > 0 && this.items().every((item) => this.selected().has(item.id)),
  );
  readonly partiallySelected = computed(() =>
    this.selected().size > 0 && !this.allPageSelected(),
  );

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
      debounceTime(180),
      distinctUntilChanged((left, right) => JSON.stringify(left) === JSON.stringify(right)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.applyStructuredFilters());
    this.categoriesService.load({ sortBy: 'sortOrder', sortDirection: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: () => undefined });
    this.recurrencesService.list({ page: 1, pageSize: 100, sortBy: 'name', sortDirection: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => this.recurrences.set(response.items),
        error: () => undefined,
      });
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const query = queryFromParams(params, this.settings.experience().defaultPageSize);
      this.query.set(query);
      this.searchDraft.set(query.search ?? '');
      this.patchFilters(query);
      this.load(query);
    });
  }

  updateSearch(value: string): void {
    this.searchDraft.set(value);
    this.searchChanges.next(value);
  }

  activeFilterCount(): number {
    return Object.values(this.filters.getRawValue()).filter(Boolean).length;
  }

  filterSummary(): string {
    const value = this.filters.getRawValue();
    const labels = [
      optionLabel(this.statuses, value.status),
      optionLabel(this.types, value.type),
      optionLabel(this.sources, value.source),
      optionLabel(this.expenseStatuses, value.expenseStatus),
      this.categories().find((item) => item.id === value.categoryId)?.name,
      this.recurrences().find((item) => item.id === value.recurrenceRuleId)?.name,
    ].filter((item): item is string => Boolean(item));
    const ranges = [value.scheduledFrom || value.scheduledTo, value.expenseDateFrom || value.expenseDateTo]
      .filter(Boolean).length;
    if (ranges) labels.push(`${ranges} intervall${ranges === 1 ? 'o' : 'i'} data`);
    return labels.length ? labels.join(' · ') : 'Nessun filtro strutturato applicato';
  }

  resetFilters(): void {
    this.searchDraft.set('');
    this.filters.reset(emptyFilters(), { emitEvent: false });
    void this.navigate({ page: 1, pageSize: this.settings.experience().defaultPageSize });
  }

  filterStatus(status: ReminderStatus): void {
    void this.navigate({ ...this.query(), page: 1, status });
  }

  sort(column: ReminderSort): void {
    const current = this.query();
    const direction = current.sortBy === column && current.sortDirection === 'asc' ? 'desc' : 'asc';
    void this.navigate({ ...current, page: 1, sortBy: column, sortDirection: direction });
  }

  sortIcon(column: ReminderSort): string {
    if (this.query().sortBy !== column) return 'bi-arrow-down-up';
    return this.query().sortDirection === 'desc' ? 'bi-sort-down' : 'bi-sort-up';
  }

  ariaSort(column: ReminderSort): 'ascending' | 'descending' | 'none' {
    if (this.query().sortBy !== column) return 'none';
    return this.query().sortDirection === 'desc' ? 'descending' : 'ascending';
  }

  goToPage(page: number): void {
    void this.navigate({ ...this.query(), page });
  }

  toggleSelection(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selected.update((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  togglePage(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selected.set(checked ? new Set(this.items().map((item) => item.id)) : new Set());
  }

  clearSelection(): void {
    this.selected.set(new Set());
  }

  ask(action: ReminderAction, item?: ManagedReminder): void {
    this.confirmTarget.set(item ?? null);
    this.confirmAction.set(action);
  }

  closeConfirm(): void {
    if (this.busy()) return;
    this.confirmAction.set(null);
    this.confirmTarget.set(null);
  }

  confirmTitle(): string {
    const multiple = !this.confirmTarget();
    const labels: Record<ReminderAction, string> = {
      cancel: multiple ? 'Annulla i promemoria selezionati' : 'Annulla promemoria',
      reactivate: multiple ? 'Riattiva i promemoria selezionati' : 'Riattiva promemoria',
      delete: multiple ? 'Elimina i promemoria selezionati' : 'Elimina promemoria',
    };
    return this.confirmAction() ? labels[this.confirmAction()!] : 'Conferma operazione';
  }

  confirmMessage(): string {
    const target = this.confirmTarget();
    const count = target ? 1 : this.selected().size;
    if (this.confirmAction() === 'delete') {
      return `Verranno eliminati solo i ${count} promemoria senza storico o notifiche collegate.`;
    }
    if (this.confirmAction() === 'reactivate') {
      return `Saranno riattivati solo i ${count} promemoria futuri ancora validi.`;
    }
    return `Stai per annullare ${count} promemoria. Le notifiche già prodotte resteranno disponibili.`;
  }

  performConfirmed(): void {
    const action = this.confirmAction();
    if (!action) return;
    const target = this.confirmTarget();
    this.busy.set(true);
    if (target) {
      const request: Observable<ManagedReminder | void> = action === 'cancel'
        ? this.service.cancel(target.id)
        : action === 'reactivate'
          ? this.service.reactivate(target.id)
          : this.service.remove(target.id);
      request.pipe(
        finalize(() => this.busy.set(false)),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: () => {
          this.toast.show(actionMessage(action));
          this.confirmAction.set(null);
          this.confirmTarget.set(null);
          this.load(this.query(), false);
        },
        error: (error: unknown) => this.toast.show(apiErrorMessage(error), 'danger'),
      });
      return;
    }
    const ids = [...this.selected()];
    this.service.bulk(ids, action).pipe(
      finalize(() => this.busy.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (result) => {
        const suffix = result.skippedCount
          ? ` ${result.skippedCount} non modificati perché non consentito.`
          : '';
        this.toast.show(`${result.updatedCount} promemoria aggiornati.${suffix}`, result.skippedCount ? 'info' : 'success');
        this.selected.set(new Set());
        this.confirmAction.set(null);
        this.confirmTarget.set(null);
        this.load(this.query(), false);
      },
      error: (error: unknown) => this.toast.show(apiErrorMessage(error), 'danger'),
    });
  }

  openEdit(item: ManagedReminder): void {
    this.editDraft.set(null);
    this.editFormValid.set(false);
    this.editResetVersion.update((value) => value + 1);
    this.editTarget.set(item);
  }

  captureDrafts(drafts: ReminderDraft[]): void {
    this.editDraft.set(drafts.length === 1 ? drafts[0] : null);
    if (drafts.length !== 1) this.editFormValid.set(false);
  }

  saveEdit(): void {
    const target = this.editTarget();
    const draft = this.editDraft();
    if (!target || !draft || !this.editFormValid()) return;
    this.busy.set(true);
    this.service.update(target.id, draft).pipe(
      finalize(() => this.busy.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.toast.show('Promemoria aggiornato.');
        this.editTarget.set(null);
        this.load(this.query(), false);
      },
      error: (error: unknown) => this.toast.show(apiErrorMessage(error), 'danger'),
    });
  }

  load(query = this.query(), showLoading = true): void {
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
        this.selected.set(new Set());
      },
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }

  private applyStructuredFilters(): void {
    const value = this.filters.getRawValue();
    const next: ReminderQueryParams = {
      ...this.query(),
      page: 1,
      status: reminderStatus(value.status),
      type: reminderType(value.type),
      source: reminderSource(value.source),
      expenseStatus: expenseStatus(value.expenseStatus),
      categoryId: value.categoryId || undefined,
      recurrenceRuleId: value.recurrenceRuleId || undefined,
      scheduledFrom: value.scheduledFrom ? romeLocalDateTimeToIso(value.scheduledFrom) ?? undefined : undefined,
      scheduledTo: value.scheduledTo ? romeLocalDateTimeToIso(value.scheduledTo) ?? undefined : undefined,
      expenseDateFrom: value.expenseDateFrom || undefined,
      expenseDateTo: value.expenseDateTo || undefined,
    };
    if (JSON.stringify(cleanParams(next)) !== JSON.stringify(cleanParams(this.query()))) {
      void this.navigate(next);
    }
  }

  private patchFilters(query: ReminderQueryParams): void {
    this.filters.patchValue({
      status: query.status ?? '',
      type: query.type ?? '',
      source: query.source ?? '',
      expenseStatus: query.expenseStatus ?? '',
      categoryId: query.categoryId ?? '',
      recurrenceRuleId: query.recurrenceRuleId ?? '',
      scheduledFrom: query.scheduledFrom ? isoToRomeLocalInput(query.scheduledFrom) : '',
      scheduledTo: query.scheduledTo ? isoToRomeLocalInput(query.scheduledTo) : '',
      expenseDateFrom: query.expenseDateFrom ?? '',
      expenseDateTo: query.expenseDateTo ?? '',
    }, { emitEvent: false });
  }

  private navigate(query: ReminderQueryParams): Promise<boolean> {
    return this.router.navigate([], { relativeTo: this.route, queryParams: cleanParams(query) });
  }
}

function queryFromParams(params: ParamMap, defaultPageSize: number): ReminderQueryParams {
  const sortBy = reminderSort(params.get('sortBy'));
  return {
    page: positive(params.get('page')) ?? 1,
    pageSize: positive(params.get('pageSize')) ?? defaultPageSize,
    search: params.get('search')?.trim().slice(0, 150) || undefined,
    status: reminderStatus(params.get('status')),
    type: reminderType(params.get('type')),
    source: reminderSource(params.get('source')),
    expenseStatus: expenseStatus(params.get('expenseStatus')),
    categoryId: params.get('categoryId') || undefined,
    recurrenceRuleId: params.get('recurrenceRuleId') || undefined,
    scheduledFrom: params.get('scheduledFrom') || undefined,
    scheduledTo: params.get('scheduledTo') || undefined,
    expenseDateFrom: params.get('expenseDateFrom') || undefined,
    expenseDateTo: params.get('expenseDateTo') || undefined,
    sortBy,
    sortDirection: sortBy ? params.get('sortDirection') === 'desc' ? 'desc' : 'asc' : undefined,
  };
}

function emptyFilters() {
  return {
    status: '', type: '', source: '', expenseStatus: '', categoryId: '', recurrenceRuleId: '',
    scheduledFrom: '', scheduledTo: '', expenseDateFrom: '', expenseDateTo: '',
  };
}

function positive(value: string | null): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 100 ? parsed : undefined;
}

function reminderStatus(value: string | null): ReminderStatus | undefined {
  return REMINDER_STATUSES.some((item) => item.value === value) ? value as ReminderStatus : undefined;
}

function reminderType(value: string | null): ReminderType | undefined {
  return REMINDER_TYPES.some((item) => item.value === value) ? value as ReminderType : undefined;
}

function reminderSource(value: string | null): ReminderSource | undefined {
  return REMINDER_SOURCES.some((item) => item.value === value) ? value as ReminderSource : undefined;
}

function expenseStatus(value: string | null): ExpenseStatus | undefined {
  return value && ['PLANNED', 'COMPLETED', 'CANCELLED'].includes(value) ? value as ExpenseStatus : undefined;
}

function reminderSort(value: string | null): ReminderSort | undefined {
  return value && ['scheduledAt', 'createdAt', 'updatedAt', 'expenseDate', 'expenseDescription', 'status'].includes(value)
    ? value as ReminderSort
    : undefined;
}

function cleanParams(query: ReminderQueryParams): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') result[key] = value;
  }
  return result;
}

function optionLabel(items: ReadonlyArray<{ value: string; label: string }>, value: string): string | undefined {
  return items.find((item) => item.value === value)?.label;
}

function actionMessage(action: ReminderAction): string {
  if (action === 'cancel') return 'Promemoria annullato.';
  if (action === 'reactivate') return 'Promemoria riattivato.';
  return 'Promemoria eliminato.';
}

function toExpenseReminder(item: ManagedReminder): ExpenseReminder {
  return {
    id: item.id,
    type: item.type,
    offsetMinutes: item.offsetMinutes,
    scheduledAt: item.scheduledAt,
    isActive: item.isActive,
    processedAt: item.processedAt,
    cancelledAt: item.cancelledAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
