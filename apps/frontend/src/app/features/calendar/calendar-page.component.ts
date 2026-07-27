import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, type ParamMap, Router } from '@angular/router';
import { NgLabelTemplateDirective, NgOptionTemplateDirective, NgSelectComponent } from '@ng-select/ng-select';
import { catchError, combineLatest, debounceTime, distinctUntilChanged, EMPTY, finalize, map, startWith, Subject, switchMap, tap } from 'rxjs';

import { apiErrorMessage } from '../../core/services/api-error';
import { CalendarService } from '../../core/services/calendar.service';
import { CategoryService } from '../../core/services/category.service';
import { ExpenseService } from '../../core/services/expense.service';
import { LabelService } from '../../core/services/label.service';
import { SettingsStore } from '../../core/services/settings.store';
import { AppBreadcrumbComponent } from '../../shared/components/app-breadcrumb.component';
import { EmptyStateComponent, LoadingSkeletonComponent, PageHeaderComponent } from '../../shared/components/catalog-display.components';
import { FilterPanelComponent } from '../../shared/components/filter-panel.component';
import { MultiselectValueComponent } from '../../shared/components/multiselect-value.component';
import type { CalendarExpenseEvent, CalendarFilters, CalendarState, CalendarView } from '../../shared/models/calendar.models';
import { EscapeCloseDirective } from '../../shared/directives/escape-close.directive';
import { DEFAULT_CALENDAR_STATUSES } from '../../shared/models/calendar.models';
import { EXPENSE_STATUSES, PAYMENT_METHODS, type ExpenseDetail, type ExpenseStatus, type PaymentMethod } from '../../shared/models/expense.models';
import { activeCalendarFilterCount, calendarDays, calendarHeading, calendarQueryParams, calendarRange, longCalendarDate, parseCalendarState, shiftCalendarPeriod, todayRomeDate, validCalendarDate } from '../../shared/utilities/calendar-date';
import { QuickExpenseModalComponent } from '../expenses/components/quick-expense-modal.component';
import { CalendarExpenseEventComponent } from './calendar-expense-event.component';

@Component({
  selector: 'app-calendar-page',
  standalone: true,
  imports: [FormsModule, NgSelectComponent, NgOptionTemplateDirective, NgLabelTemplateDirective, AppBreadcrumbComponent, FilterPanelComponent, MultiselectValueComponent, PageHeaderComponent, EmptyStateComponent, LoadingSkeletonComponent, QuickExpenseModalComponent, CalendarExpenseEventComponent, EscapeCloseDirective],
  templateUrl: './calendar-page.component.html',
  styleUrl: './calendar-page.component.scss',
})
export class CalendarPageComponent {
  private static readonly FILTERS_EXPANDED_STORAGE_KEY = 'carbexpenses.calendar.filters.expanded.v1';
  private readonly calendar = inject(CalendarService);
  private readonly expensesService = inject(ExpenseService);
  private readonly categoryService = inject(CategoryService);
  private readonly labelService = inject(LabelService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly settings = inject(SettingsStore);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly refresh = new Subject<void>();
  private readonly searchChanges = new Subject<string>();
  private readonly today = todayRomeDate();
  private observedExpenseVersion = this.expensesService.changeVersion();

  readonly categories = this.categoryService.categories;
  readonly labels = this.labelService.labels;
  readonly statuses = EXPENSE_STATUSES;
  readonly paymentMethods = PAYMENT_METHODS;
  readonly weekdays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
  readonly views: ReadonlyArray<{ value: CalendarView; label: string; icon: string }> = [
    { value: 'month', label: 'Mese', icon: 'bi-calendar3' },
    { value: 'week', label: 'Settimana', icon: 'bi-calendar-week' },
    { value: 'year', label: 'Anno', icon: 'bi-calendar2-range' },
    { value: 'list', label: 'Elenco', icon: 'bi-list-ul' },
  ];

  readonly state = signal<CalendarState>(parseCalendarState({}, this.today, this.defaultView()).state);
  readonly range = computed(() => calendarRange(this.state().view, this.state().date));
  readonly days = computed(() => calendarDays(this.range(), this.state().date, this.today));
  readonly heading = computed(() => calendarHeading(this.state().view, this.state().date));
  readonly events = signal<CalendarExpenseEvent[]>([]);
  readonly eventsByDate = computed(() => {
    const grouped = new Map<string, CalendarExpenseEvent[]>();
    for (const event of this.events()) grouped.set(event.expenseDate, [...(grouped.get(event.expenseDate) ?? []), event]);
    return grouped;
  });
  readonly listDays = computed(() => this.days().map((day) => ({ ...day, events: this.eventsByDate().get(day.date) ?? [] })).filter((day) => day.events.length > 0));
  readonly yearMonths = computed(() => {
    const year = Number(this.state().date.slice(0, 4));
    return Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, '0');
      const anchor = `${year}-${month}-01`;
      const prefix = `${year}-${month}`;
      return {
        anchor,
        label: calendarHeading('month', anchor),
        days: calendarDays(calendarRange('month', anchor), anchor, this.today),
        eventCount: this.events().filter((event) => event.expenseDate.startsWith(prefix)).length,
      };
    });
  });
  readonly overdueEvents = computed(() => this.events().filter((event) => event.isOverdue));
  readonly activeFilterCount = computed(() => activeCalendarFilterCount(this.state().filters));
  readonly activeFilterSummary = computed(() => {
    const descriptions = this.filterDescriptions();
    if (!descriptions.length) return 'Nessun filtro applicato';
    const visible = descriptions.slice(0, 3).join(' · ');
    const remaining = descriptions.length - 3;
    return remaining > 0 ? `${visible} · +${remaining}` : visible;
  });

  readonly loading = signal(true);
  readonly catalogError = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly filterOpen = signal(this.initialFilterExpandedState());
  readonly searchDraft = signal('');
  readonly busyIds = signal<Set<string>>(new Set());
  readonly quickOpen = signal(false);
  readonly selectedDate = signal<string | null>(null);
  readonly selectedTime = signal<string | null>(null);
  readonly moveTarget = signal<CalendarExpenseEvent | null>(null);
  readonly moveDate = signal('');
  readonly draggingId = signal<string | null>(null);

  constructor() {
    this.settings.ensureLoaded();
    this.loadCatalogs();
    this.searchChanges.pipe(
      map((value) => value.trim().replace(/\s+/g, ' ').slice(0, 150)),
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((search) => {
      if (search !== this.state().filters.search) this.patchFilters({ search });
    });
    combineLatest([this.route.queryParamMap, this.refresh.pipe(startWith(undefined))]).pipe(
      switchMap(([params]) => {
        const parsed = parseCalendarState(paramRecord(params), this.today, this.defaultView());
        const canonical = params.has('view') && params.has('date') && params.has('status');
        if (!parsed.valid || !canonical) {
          void this.navigate(parsed.state, true);
          return EMPTY;
        }
        this.state.set(parsed.state);
        this.searchDraft.set(parsed.state.filters.search);
        this.loading.set(true);
        this.error.set(null);
        const range = calendarRange(parsed.state.view, parsed.state.date);
        return this.calendar.expenses({
          ...range,
          status: parsed.state.filters.status,
          categoryId: parsed.state.filters.categoryId || undefined,
          labelIds: parsed.state.filters.labelIds,
          paymentMethod: parsed.state.filters.paymentMethod || undefined,
          search: parsed.state.filters.search || undefined,
        }).pipe(
          tap((events) => this.events.set(events)),
          catchError((error: unknown) => {
            this.error.set(apiErrorMessage(error));
            return EMPTY;
          }),
          finalize(() => this.loading.set(false)),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    effect(() => {
      const version = this.expensesService.changeVersion();
      if (version > this.observedExpenseVersion) {
        this.observedExpenseVersion = version;
        this.refresh.next();
      }
    });
  }

  private defaultView(): CalendarView {
    const view = this.settings.experience().defaultCalendarView;
    return view === 'WEEK' ? 'week' : view === 'LIST' ? 'list' : 'month';
  }

  previous(): void { this.patchState({ date: shiftCalendarPeriod(this.state().date, this.state().view, -1) }); }
  next(): void { this.patchState({ date: shiftCalendarPeriod(this.state().date, this.state().view, 1) }); }
  current(): void { this.patchState({ date: this.today }); }
  changeView(view: CalendarView): void { this.patchState({ view }); }

  openCreate(date = this.state().date, time: string | null = null): void {
    this.selectedDate.set(date);
    this.selectedTime.set(time);
    this.quickOpen.set(true);
  }
  expenseCreated(expense: ExpenseDetail): void { this.notice.set(`Spesa “${expense.description}” creata nel calendario.`); }
  closeQuickCreate(): void {
    this.quickOpen.set(false);
    this.selectedDate.set(null);
    this.selectedTime.set(null);
  }

  viewExpense(event: CalendarExpenseEvent): void {
    void this.router.navigate(['/expenses', event.expenseId], { queryParams: this.returnQuery() });
  }
  editExpense(event: CalendarExpenseEvent): void {
    void this.router.navigate(['/expenses', event.expenseId, 'edit'], { queryParams: this.returnQuery() });
  }

  updateStatuses(value: ExpenseStatus[] | null): void { this.patchFilters({ status: value?.length ? value : [...DEFAULT_CALENDAR_STATUSES] }); }
  updateCategory(value: string | null): void { this.patchFilters({ categoryId: value ?? '' }); }
  updateLabels(value: string[] | null): void { this.patchFilters({ labelIds: value ?? [] }); }
  updatePayment(value: PaymentMethod | null): void { this.patchFilters({ paymentMethod: value ?? '' }); }
  updateSearch(value: string): void {
    this.searchDraft.set(value);
    this.searchChanges.next(value);
  }
  resetFilters(): void {
    this.searchDraft.set('');
    this.patchState({ filters: { status: [...DEFAULT_CALENDAR_STATUSES], categoryId: '', labelIds: [], paymentMethod: '', search: '' } });
  }
  setFilterOpen(open: boolean): void {
    this.filterOpen.set(open);
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      window.localStorage.setItem(
        CalendarPageComponent.FILTERS_EXPANDED_STORAGE_KEY,
        String(open),
      );
    } catch {
      // Lo stato in memoria resta disponibile se lo storage non è accessibile.
    }
  }
  retry(): void { this.refresh.next(); }

  private filterDescriptions(): string[] {
    const filters = this.state().filters;
    const descriptions: string[] = [];
    const defaultStatus = filters.status.length === DEFAULT_CALENDAR_STATUSES.length
      && DEFAULT_CALENDAR_STATUSES.every((status) => filters.status.includes(status));
    if (!defaultStatus) {
      descriptions.push(`Stati: ${filters.status.map((status) =>
        this.statuses.find((item) => item.value === status)?.label ?? status).join(', ')}`);
    }
    if (filters.search) descriptions.push(`Ricerca: ${filters.search}`);
    if (filters.categoryId) {
      descriptions.push(`Categoria: ${this.categories().find((item) => item.id === filters.categoryId)?.name ?? filters.categoryId}`);
    }
    if (filters.labelIds.length) {
      descriptions.push(`Etichette: ${filters.labelIds.map((id) =>
        this.labels().find((item) => item.id === id)?.name ?? id).join(', ')}`);
    }
    if (filters.paymentMethod) {
      descriptions.push(`Pagamento: ${this.paymentMethods.find((item) =>
        item.value === filters.paymentMethod)?.label ?? filters.paymentMethod}`);
    }
    return descriptions;
  }

  private initialFilterExpandedState(): boolean {
    if (!isPlatformBrowser(this.platformId)) return true;
    try {
      const stored = window.localStorage.getItem(CalendarPageComponent.FILTERS_EXPANDED_STORAGE_KEY);
      if (stored === 'true' || stored === 'false') return stored === 'true';
    } catch {
      // Usa il comportamento responsive quando lo storage non è disponibile.
    }
    return window.matchMedia?.('(min-width: 992px)').matches ?? true;
  }

  eventsForDay(date: string): CalendarExpenseEvent[] { return this.eventsByDate().get(date) ?? []; }
  moreEvents(date: string, shown = 3): number { return Math.max(0, this.eventsForDay(date).length - shown); }
  openListFor(date: string): void { this.patchState({ view: 'list', date }); }
  openMonth(date: string): void { this.patchState({ view: 'month', date }); }
  dateLabel(value: string): string { return longCalendarDate(value); }
  isBusy(id: string): boolean { return this.busyIds().has(id); }

  changeStatus(event: CalendarExpenseEvent, status: ExpenseStatus): void {
    if (this.isBusy(event.id) || event.status === status) return;
    this.setBusy(event.id, true);
    this.error.set(null);
    this.expensesService.setStatus(event.expenseId, status).pipe(
      finalize(() => this.setBusy(event.id, false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (expense) => {
        this.replaceEvent(event.id, eventFromExpense(expense, this.today));
        this.notice.set(`Stato di “${event.title}” aggiornato.`);
      },
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }

  requestDateChange(event: CalendarExpenseEvent): void {
    if (event.status !== 'PLANNED') return;
    this.moveTarget.set(event);
    this.moveDate.set(event.expenseDate);
  }
  cancelDateChange(): void { this.moveTarget.set(null); this.moveDate.set(''); }
  confirmDateChange(): void {
    const target = this.moveTarget();
    const date = this.moveDate();
    if (!target || !validCalendarDate(date)) {
      this.error.set('Seleziona una data valida.');
      return;
    }
    this.cancelDateChange();
    this.moveExpense(target, date);
  }

  startDrag(id: string): void { this.draggingId.set(id); }
  allowDrop(domEvent: DragEvent): void {
    const event = this.events().find((item) => item.id === this.draggingId());
    if (event?.status === 'PLANNED') domEvent.preventDefault();
  }
  dropOn(date: string, domEvent: DragEvent): void {
    domEvent.preventDefault();
    const id = this.draggingId() ?? domEvent.dataTransfer?.getData('text/plain') ?? '';
    this.draggingId.set(null);
    const event = this.events().find((item) => item.id === id);
    if (event?.status === 'PLANNED') this.moveExpense(event, date);
  }
  endDrag(): void { this.draggingId.set(null); }

  private moveExpense(event: CalendarExpenseEvent, date: string): void {
    if (event.status !== 'PLANNED' || date === event.expenseDate || this.isBusy(event.id)) return;
    const snapshot = this.events();
    this.replaceEvent(event.id, { ...event, expenseDate: date, isOverdue: date < this.today });
    this.setBusy(event.id, true);
    this.error.set(null);
    this.expensesService.update(event.expenseId, { expenseDate: date }).pipe(
      finalize(() => this.setBusy(event.id, false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (expense) => {
        this.replaceEvent(event.id, eventFromExpense(expense, this.today));
        this.notice.set(`“${event.title}” spostata al ${longCalendarDate(date)}.`);
      },
      error: (error: unknown) => {
        this.events.set(snapshot);
        this.error.set(`Spostamento annullato: ${apiErrorMessage(error)} La data originale è stata ripristinata.`);
      },
    });
  }

  private replaceEvent(id: string, replacement: CalendarExpenseEvent): void {
    this.events.update((items) => items.map((item) => item.id === id ? replacement : item).sort(compareEvents));
  }
  private patchFilters(patch: Partial<CalendarFilters>): void { this.patchState({ filters: { ...this.state().filters, ...patch } }); }
  private patchState(patch: Partial<CalendarState>): void { void this.navigate({ ...this.state(), ...patch }); }
  private navigate(state: CalendarState, replaceUrl = false): Promise<boolean> {
    return this.router.navigate([], { relativeTo: this.route, queryParams: calendarQueryParams(state), replaceUrl });
  }
  private returnQuery(): Record<string, string> { return { ...calendarQueryParams(this.state()), returnTo: 'calendar' }; }
  private setBusy(id: string, value: boolean): void {
    this.busyIds.update((current) => {
      const next = new Set(current);
      if (value) next.add(id); else next.delete(id);
      return next;
    });
  }
  private loadCatalogs(): void {
    this.categoryService.load({ sortBy: 'sortOrder', sortDirection: 'asc' }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: (error: unknown) => this.catalogError.set(apiErrorMessage(error)),
    });
    this.labelService.load({ sortBy: 'sortOrder', sortDirection: 'asc' }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      error: (error: unknown) => this.catalogError.set(apiErrorMessage(error)),
    });
  }
}

function paramRecord(params: ParamMap): Record<string, string | null> {
  return {
    view: params.get('view'),
    date: params.get('date'),
    status: params.get('status'),
    categoryId: params.get('categoryId'),
    labelIds: params.get('labelIds'),
    paymentMethod: params.get('paymentMethod'),
    search: params.get('search'),
  };
}
function eventFromExpense(expense: ExpenseDetail, today: string): CalendarExpenseEvent {
  return {
    id: expense.id, expenseId: expense.id, title: expense.description, amount: expense.amount,
    expenseDate: expense.expenseDate, expenseTime: expense.expenseTime,
    allDay: expense.expenseTime === null, status: expense.status,
    isOverdue: expense.status === 'PLANNED' && expense.expenseDate < today,
    merchant: expense.merchant,
    category: { id: expense.category.id, name: expense.category.name, color: expense.category.color, icon: expense.category.icon },
    labels: expense.labels.map((label) => ({ id: label.id, name: label.name, color: label.color, icon: label.icon })),
    paymentMethod: expense.paymentMethod,
    generatedByRecurrence: expense.generatedByRecurrence,
    recurrence: expense.recurrence,
  };
}
function compareEvents(a: CalendarExpenseEvent, b: CalendarExpenseEvent): number {
  return a.expenseDate.localeCompare(b.expenseDate)
    || (a.expenseTime ?? '').localeCompare(b.expenseTime ?? '')
    || a.title.localeCompare(b.title, 'it');
}
