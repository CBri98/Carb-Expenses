import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { ExpenseFiltersComponent } from './expense-filters.component';

describe('ExpenseFiltersComponent', () => {
  it('ripristina i filtri dai query parameter e li reimposta', async () => {
    await TestBed.configureTestingModule({ imports: [ExpenseFiltersComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ExpenseFiltersComponent);
    fixture.componentRef.setInput('query', {
      search: 'pane', month: 7, year: 2026, status: 'COMPLETED', pageSize: 50,
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.form.getRawValue()).toMatchObject({
      search: 'pane', month: '7', year: '2026', statuses: ['COMPLETED'], pageSize: '50',
    });

    fixture.componentInstance.reset();
    expect(fixture.componentInstance.form.getRawValue()).toMatchObject({
      search: '', month: null, year: '', statuses: [], pageSize: '20', recurrenceMode: 'ALL',
    });
  });

  it('applica debounce e normalizza importi con virgola', async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [ExpenseFiltersComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ExpenseFiltersComponent);
    const emitted = vi.fn();
    fixture.componentInstance.queryChange.subscribe(emitted);
    fixture.detectChanges();
    emitted.mockClear();
    fixture.componentInstance.form.patchValue({ search: ' test ', minAmount: '12,50' });
    await vi.advanceTimersByTimeAsync(350);
    expect(emitted).toHaveBeenCalledWith(expect.objectContaining({
      search: 'test', minAmount: '12.50', pageSize: 20,
    }));
    vi.useRealTimers();
  });

  it('mostra conteggio e riepilogo quando il pannello è chiuso', async () => {
    await TestBed.configureTestingModule({ imports: [ExpenseFiltersComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ExpenseFiltersComponent);
    fixture.componentRef.setInput('query', {
      search: 'benzina', status: 'COMPLETED', pageSize: 20,
    });
    fixture.detectChanges();
    fixture.componentInstance.expanded.set(false);
    fixture.detectChanges();

    expect(fixture.componentInstance.activeFilterCount()).toBe(2);
    expect(fixture.componentInstance.activeFilterSummary()).toContain('Ricerca: benzina');
    expect(fixture.nativeElement.querySelector('.filters__summary')?.textContent).toContain(
      'Stati: Completata',
    );
    expect(fixture.nativeElement.querySelector('#expense-filters-panel')).toBeNull();
  });

  it('emette filtri multipli e modalità ricorrenza', async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [ExpenseFiltersComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ExpenseFiltersComponent);
    const emitted = vi.fn();
    fixture.componentInstance.queryChange.subscribe(emitted);
    fixture.detectChanges();
    emitted.mockClear();
    fixture.componentInstance.form.patchValue({
      categoryIds: ['category-1', 'category-2'],
      statuses: ['PLANNED', 'COMPLETED'],
      paymentMethods: ['CASH', 'DEBIT_CARD'],
      recurrenceMode: 'ONLY',
    });
    await vi.advanceTimersByTimeAsync(350);
    expect(emitted).toHaveBeenCalledWith(expect.objectContaining({
      categoryIds: ['category-1', 'category-2'],
      statuses: ['PLANNED', 'COMPLETED'],
      paymentMethods: ['CASH', 'DEBIT_CARD'],
      recurrenceMode: 'ONLY',
    }));
    vi.useRealTimers();
  });

  it('salva e ripristina la preferenza di apertura del pannello', async () => {
    const storageKey = 'carbexpenses.expenses.filters.expanded.v1';
    window.localStorage.removeItem(storageKey);
    await TestBed.configureTestingModule({ imports: [ExpenseFiltersComponent] }).compileComponents();

    const firstFixture = TestBed.createComponent(ExpenseFiltersComponent);
    firstFixture.componentInstance.expanded.set(true);
    firstFixture.componentInstance.toggleExpanded();
    expect(window.localStorage.getItem(storageKey)).toBe('false');
    firstFixture.destroy();

    const secondFixture = TestBed.createComponent(ExpenseFiltersComponent);
    expect(secondFixture.componentInstance.expanded()).toBe(false);
    window.localStorage.removeItem(storageKey);
  });
});
