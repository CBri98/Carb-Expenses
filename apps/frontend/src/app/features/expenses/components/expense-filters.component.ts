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
import type { ExpenseQueryParams } from '../../../shared/models/expense.models';
import { EXPENSE_STATUSES, PAYMENT_METHODS } from '../../../shared/models/expense.models';

@Component({
  selector: 'app-expense-filters',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgSelectComponent,
    NgOptionTemplateDirective,
    NgLabelTemplateDirective,
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
  readonly queryChange = output<ExpenseQueryParams>();
  readonly expanded = signal(this.initialExpandedState());
  readonly statuses = EXPENSE_STATUSES;
  readonly paymentMethods = PAYMENT_METHODS;
  readonly months = [
    { value: '1', label: 'Gennaio', icon: 'bi-calendar3' },
    { value: '2', label: 'Febbraio', icon: 'bi-calendar3' },
    { value: '3', label: 'Marzo', icon: 'bi-calendar3' },
    { value: '4', label: 'Aprile', icon: 'bi-calendar3' },
    { value: '5', label: 'Maggio', icon: 'bi-calendar3' },
    { value: '6', label: 'Giugno', icon: 'bi-calendar3' },
    { value: '7', label: 'Luglio', icon: 'bi-calendar3' },
    { value: '8', label: 'Agosto', icon: 'bi-calendar3' },
    { value: '9', label: 'Settembre', icon: 'bi-calendar3' },
    { value: '10', label: 'Ottobre', icon: 'bi-calendar3' },
    { value: '11', label: 'Novembre', icon: 'bi-calendar3' },
    { value: '12', label: 'Dicembre', icon: 'bi-calendar3' },
  ] as const;
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
    categoryId: this.formBuilder.control<string | null>(null),
    labelIds: this.formBuilder.nonNullable.control<string[]>([]),
    status: this.formBuilder.control<ExpenseQueryParams['status'] | null>(null),
    paymentMethod: this.formBuilder.control<ExpenseQueryParams['paymentMethod'] | null>(null),
    minAmount: [''], maxAmount: [''],
    pageSize: ['20'], sortBy: ['expenseDate'], sortDirection: ['desc'],
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
      search: '', dateFrom: '', dateTo: '', month: null, year: '', categoryId: null,
      labelIds: [], status: null, paymentMethod: null, minAmount: '', maxAmount: '',
      pageSize: '20', sortBy: 'expenseDate', sortDirection: 'desc',
    });
  }

  toggleExpanded(): void {
    const next = !this.expanded();
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
        categoryId: query.categoryId ?? null, labelIds: query.labelIds ?? [], status: query.status ?? null,
        paymentMethod: query.paymentMethod ?? null, minAmount: query.minAmount ?? '', maxAmount: query.maxAmount ?? '',
        pageSize: String(query.pageSize ?? 20), sortBy: query.sortBy ?? 'expenseDate',
        sortDirection: query.sortDirection ?? 'desc',
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
    if (query.categoryId) {
      const name = this.categories().find((category) => category.id === query.categoryId)?.name;
      descriptions.push(`Categoria: ${name ?? query.categoryId}`);
    }
    if (query.labelIds?.length) {
      const names = query.labelIds.map(
        (id) => this.labels().find((label) => label.id === id)?.name ?? id,
      );
      descriptions.push(`Etichette: ${names.join(', ')}`);
    }
    if (query.status) {
      const label = this.statuses.find((status) => status.value === query.status)?.label;
      descriptions.push(`Stato: ${label ?? query.status}`);
    }
    if (query.paymentMethod) {
      const label = this.paymentMethods.find(
        (method) => method.value === query.paymentMethod,
      )?.label;
      descriptions.push(`Pagamento: ${label ?? query.paymentMethod}`);
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
      categoryId: value.categoryId ?? undefined,
      labelIds: value.labelIds.length ? value.labelIds : undefined,
      status: value.status ?? undefined,
      paymentMethod: value.paymentMethod ?? undefined,
      minAmount: value.minAmount.trim().replace(',', '.') || undefined,
      maxAmount: value.maxAmount.trim().replace(',', '.') || undefined,
      pageSize: optionalInteger(value.pageSize) ?? 20,
      sortBy: value.sortBy as ExpenseQueryParams['sortBy'],
      sortDirection: value.sortDirection as ExpenseQueryParams['sortDirection'],
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
