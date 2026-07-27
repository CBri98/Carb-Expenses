import {
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  NgLabelTemplateDirective,
  NgOptionTemplateDirective,
  NgSelectComponent,
} from '@ng-select/ng-select';
import { debounceTime } from 'rxjs';

import type { Category, Label } from '../../../shared/models/catalog.models';
import type {
  ExpenseQueryParams,
  ExpenseRecurrenceMode,
  ExpenseStatus,
  PaymentMethod,
} from '../../../shared/models/expense.models';
import { EXPENSE_STATUSES, PAYMENT_METHODS } from '../../../shared/models/expense.models';
import { FilterPanelComponent } from '../../../shared/components/filter-panel.component';

@Component({
  selector: 'app-expense-filters',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgSelectComponent,
    NgOptionTemplateDirective,
    NgLabelTemplateDirective,
    FilterPanelComponent,
  ],
  templateUrl: './expense-filters.component.html',
  styleUrl: './expense-filters.component.scss',
})
export class ExpenseFiltersComponent {
  private static readonly EXPANDED_STORAGE_KEY = 'carbexpenses.expenses.filters.expanded.v1';

  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly query = input<ExpenseQueryParams>({});
  readonly categories = input<readonly Category[]>([]);
  readonly labels = input<readonly Label[]>([]);
  readonly defaultPageSize = input(20);
  readonly queryChange = output<ExpenseQueryParams>();
  readonly expanded = signal(this.initialExpandedState());
  readonly statuses = EXPENSE_STATUSES;
  readonly paymentMethods = PAYMENT_METHODS;
  readonly months = [
    { value: '1', label: '01 Gennaio' },
    { value: '2', label: '02 Febbraio' },
    { value: '3', label: '03 Marzo' },
    { value: '4', label: '04 Aprile' },
    { value: '5', label: '05 Maggio' },
    { value: '6', label: '06 Giugno' },
    { value: '7', label: '07 Luglio' },
    { value: '8', label: '08 Agosto' },
    { value: '9', label: '09 Settembre' },
    { value: '10', label: '10 Ottobre' },
    { value: '11', label: '11 Novembre' },
    { value: '12', label: '12 Dicembre' },
  ] as const;
  readonly recurrenceModes: ReadonlyArray<{
    value: ExpenseRecurrenceMode;
    label: string;
    icon: string;
  }> = [
    { value: 'ALL', label: 'Tutte le spese', icon: 'bi-collection' },
    { value: 'EXCLUDE', label: 'Escludi ricorrenti', icon: 'bi-calendar-x' },
    { value: 'ONLY', label: 'Solo ricorrenti', icon: 'bi-arrow-repeat' },
  ];
  readonly sortOptions = [
    { value: 'expenseDate', label: 'Data spesa', icon: 'bi-calendar-event' },
    { value: 'amount', label: 'Importo', icon: 'bi-currency-euro' },
    { value: 'description', label: 'Descrizione', icon: 'bi-fonts' },
    { value: 'createdAt', label: 'Inserimento', icon: 'bi-plus-circle' },
    { value: 'updatedAt', label: 'Ultima modifica', icon: 'bi-pencil-square' },
  ] as const;
  readonly directions = [
    { value: 'desc', label: 'Decrescente', icon: 'bi-sort-down' },
    { value: 'asc', label: 'Crescente', icon: 'bi-sort-up' },
  ] as const;
  readonly pageSizes = [
    { value: '10', label: '10 risultati', icon: 'bi-list-ul' },
    { value: '20', label: '20 risultati', icon: 'bi-list-ul' },
    { value: '50', label: '50 risultati', icon: 'bi-list-ul' },
    { value: '100', label: '100 risultati', icon: 'bi-list-ul' },
  ] as const;
  readonly activeFilterCount = computed(() => this.activeFilterDescriptions().length);
  readonly activeFilterSummary = computed(() => {
    const descriptions = this.activeFilterDescriptions();
    if (!descriptions.length) return 'Nessun filtro applicato';
    const visible = descriptions.slice(0, 3).join(' · ');
    const remaining = descriptions.length - 3;
    return remaining > 0 ? `${visible} · +${remaining}` : visible;
  });

  readonly form = this.formBuilder.nonNullable.group({
    search: [''], dateFrom: [''], dateTo: [''],
    month: this.formBuilder.control<string | null>(null), year: [''],
    categoryIds: this.formBuilder.nonNullable.control<string[]>([]),
    labelIds: this.formBuilder.nonNullable.control<string[]>([]),
    statuses: this.formBuilder.nonNullable.control<ExpenseStatus[]>([]),
    paymentMethods: this.formBuilder.nonNullable.control<PaymentMethod[]>([]),
    recurrenceMode: this.formBuilder.nonNullable.control<ExpenseRecurrenceMode>('ALL'),
    minAmount: [''], maxAmount: [''],
    pageSize: ['20'],
    sortBy: this.formBuilder.control<ExpenseQueryParams['sortBy'] | null>(null),
    sortDirection: this.formBuilder.control<ExpenseQueryParams['sortDirection'] | null>(null),
  });

  constructor() {
    effect(() => this.applyQuery(this.query()));
    this.form.valueChanges.pipe(
      debounceTime(300),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.queryChange.emit(this.toQuery()));
  }

  reset(): void {
    this.form.reset({
      search: '', dateFrom: '', dateTo: '', month: null, year: '', categoryIds: [],
      labelIds: [], statuses: [], paymentMethods: [], recurrenceMode: 'ALL',
      minAmount: '', maxAmount: '', pageSize: String(this.defaultPageSize()),
      sortBy: null, sortDirection: null,
    });
  }

  toggleExpanded(): void {
    this.setExpanded(!this.expanded());
  }

  setExpanded(next: boolean): void {
    this.expanded.set(next);
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      window.localStorage.setItem(
        ExpenseFiltersComponent.EXPANDED_STORAGE_KEY,
        String(next),
      );
    } catch {
      // Lo stato in memoria resta comunque funzionante se lo storage non è disponibile.
    }
  }

  clearPeriod(mode: 'range' | 'month'): void {
    if (mode === 'range' && (this.form.controls.dateFrom.value || this.form.controls.dateTo.value)) {
      this.form.patchValue({ month: '', year: '' });
    }
    if (mode === 'month' && (this.form.controls.month.value || this.form.controls.year.value)) {
      this.form.patchValue({ dateFrom: '', dateTo: '' });
    }
  }

  private applyQuery(query: ExpenseQueryParams): void {
    this.form.reset(
      {
        search: query.search ?? '', dateFrom: query.dateFrom ?? '', dateTo: query.dateTo ?? '',
        month: query.month === undefined ? null : String(query.month),
        year: query.year === undefined ? '' : String(query.year),
        categoryIds: query.categoryIds ?? (query.categoryId ? [query.categoryId] : []),
        labelIds: query.labelIds ?? [],
        statuses: query.statuses ?? (query.status ? [query.status] : []),
        paymentMethods: query.paymentMethods ?? (query.paymentMethod ? [query.paymentMethod] : []),
        recurrenceMode: query.recurrenceMode ?? 'ALL',
        minAmount: query.minAmount ?? '', maxAmount: query.maxAmount ?? '',
        pageSize: String(query.pageSize ?? this.defaultPageSize()), sortBy: query.sortBy ?? null,
        sortDirection: query.sortDirection ?? null,
      },
      { emitEvent: false },
    );
  }

  private activeFilterDescriptions(): string[] {
    const query = this.query();
    const descriptions: string[] = [];
    if (query.search) descriptions.push(`Ricerca: ${query.search}`);
    if (query.dateFrom) descriptions.push(`Dal ${query.dateFrom}`);
    if (query.dateTo) descriptions.push(`Al ${query.dateTo}`);
    if (query.month) descriptions.push(`Mese ${query.month}`);
    if (query.year) descriptions.push(`Anno ${query.year}`);
    const categoryIds = query.categoryIds ?? (query.categoryId ? [query.categoryId] : []);
    if (categoryIds.length) {
      const names = categoryIds.map(
        (id) => this.categories().find((category) => category.id === id)?.name ?? id,
      );
      descriptions.push(`Categorie: ${names.join(', ')}`);
    }
    if (query.labelIds?.length) {
      const names = query.labelIds.map(
        (id) => this.labels().find((label) => label.id === id)?.name ?? id,
      );
      descriptions.push(`Etichette: ${names.join(', ')}`);
    }
    const statuses = query.statuses ?? (query.status ? [query.status] : []);
    if (statuses.length) {
      const names = statuses.map(
        (value) => this.statuses.find((status) => status.value === value)?.label ?? value,
      );
      descriptions.push(`Stati: ${names.join(', ')}`);
    }
    const paymentMethods = query.paymentMethods ?? (query.paymentMethod ? [query.paymentMethod] : []);
    if (paymentMethods.length) {
      const names = paymentMethods.map(
        (value) => this.paymentMethods.find((method) => method.value === value)?.label ?? value,
      );
      descriptions.push(`Pagamenti: ${names.join(', ')}`);
    }
    if (query.recurrenceMode && query.recurrenceMode !== 'ALL') {
      descriptions.push(query.recurrenceMode === 'ONLY' ? 'Solo ricorrenti' : 'Ricorrenti escluse');
    }
    if (query.minAmount) descriptions.push(`Min: ${query.minAmount} €`);
    if (query.maxAmount) descriptions.push(`Max: ${query.maxAmount} €`);
    return descriptions;
  }

  private initialExpandedState(): boolean {
    if (!isPlatformBrowser(this.platformId)) return true;
    try {
      const stored = window.localStorage.getItem(
        ExpenseFiltersComponent.EXPANDED_STORAGE_KEY,
      );
      if (stored === 'true' || stored === 'false') return stored === 'true';
    } catch {
      // Usa il comportamento responsive quando lo storage non è disponibile.
    }
    return window.matchMedia?.('(min-width: 992px)').matches ?? true;
  }

  private toQuery(): ExpenseQueryParams {
    const value = this.form.getRawValue();
    return compactQuery({
      search: value.search.trim() || undefined,
      dateFrom: value.dateFrom || undefined,
      dateTo: value.dateTo || undefined,
      month: optionalInteger(value.month),
      year: optionalInteger(value.year),
      categoryIds: value.categoryIds.length ? value.categoryIds : undefined,
      labelIds: value.labelIds.length ? value.labelIds : undefined,
      statuses: value.statuses.length ? value.statuses : undefined,
      paymentMethods: value.paymentMethods.length ? value.paymentMethods : undefined,
      recurrenceMode: value.recurrenceMode === 'ALL' ? undefined : value.recurrenceMode,
      minAmount: value.minAmount.trim().replace(',', '.') || undefined,
      maxAmount: value.maxAmount.trim().replace(',', '.') || undefined,
      pageSize: optionalInteger(value.pageSize) ?? this.defaultPageSize(),
      sortBy: value.sortBy ?? undefined,
      sortDirection: value.sortBy ? value.sortDirection ?? 'asc' : undefined,
    });
  }
}

function optionalInteger(value: string | null): number | undefined {
  if (!value) return undefined;
  const result = Number(value);
  return Number.isInteger(result) ? result : undefined;
}

function compactQuery(query: ExpenseQueryParams): ExpenseQueryParams {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined),
  ) as ExpenseQueryParams;
}
