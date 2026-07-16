import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CategoryService } from '../../../core/services/category.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { LabelService } from '../../../core/services/label.service';
import type { ExpenseListItem, ExpenseQueryParams } from '../../../shared/models/expense.models';
import { ExpensesPageComponent } from './expenses-page.component';

const item: ExpenseListItem = {
  id: '30000000-0000-4000-8000-000000000001', description: 'Spesa pane', amount: '10.00',
  expenseDate: '2026-07-14', expenseTime: null, merchant: null, paymentMethod: 'CASH',
  notes: null, status: 'COMPLETED', labels: [], createdAt: '', updatedAt: '',
  category: { id: 'category-1', name: 'Casa', color: '#4F46E5', icon: 'bi-house', isActive: true },
};

describe('ExpensesPageComponent', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => window.localStorage.clear());

  it('carica query URL e renderizza la lista paginata', async () => {
    const setup = await createFixture({ page: '2', search: 'pane' });
    setup.fixture.detectChanges();
    expect(setup.expenses.list).toHaveBeenCalledWith(expect.objectContaining({ page: 2, search: 'pane' }));
    expect((setup.fixture.nativeElement as HTMLElement).textContent).toContain('Spesa pane');
    expect((setup.fixture.nativeElement as HTMLElement).textContent).toContain('Pagina 2 di 3');
  });

  it('sincronizza filtri, paginazione e ordinamento nel router', async () => {
    const setup = await createFixture({});
    setup.fixture.componentInstance.applyFilters({ month: 7, year: 2026, sortBy: 'amount' });
    expect(setup.router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({ month: 7, year: 2026, page: 1, sortBy: 'amount' }),
    }));
    setup.fixture.componentInstance.goToPage(3);
    expect(setup.router.navigate).toHaveBeenLastCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({ page: 3 }),
    }));
  });

  it('gestisce duplicazione e cambio stato tramite il service', async () => {
    const setup = await createFixture({});
    setup.fixture.componentInstance.duplicateExpense(item);
    setup.fixture.componentInstance.updateStatus({ expense: item, status: 'PLANNED' });
    expect(setup.expenses.duplicate).toHaveBeenCalledWith(item.id);
    expect(setup.expenses.setStatus).toHaveBeenCalledWith(item.id, 'PLANNED');
  });

  it('ripristina e salva la preferenza per nascondere le spese future', async () => {
    window.localStorage.setItem('carbexpenses.expenses.showFuture.v1', 'false');
    const setup = await createFixture({});
    setup.fixture.detectChanges();

    expect(setup.fixture.componentInstance.showFuture()).toBe(false);
    expect(setup.expenses.list).toHaveBeenCalledWith(expect.objectContaining({ includeFuture: false }));
    const toggle = (setup.fixture.nativeElement as HTMLElement)
      .querySelector<HTMLInputElement>('#show-future-expenses');
    expect(toggle?.checked).toBe(false);

    if (!toggle) throw new Error('Toggle spese future non trovato');
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change', { bubbles: true }));
    setup.fixture.detectChanges();

    expect(window.localStorage.getItem('carbexpenses.expenses.showFuture.v1')).toBe('true');
    const lastQuery = setup.expenses.list.mock.calls.at(-1)?.[0];
    expect(lastQuery).not.toHaveProperty('includeFuture');
  });
});

async function createFixture(params: Record<string, string>) {
  const queryParamMap = new BehaviorSubject(convertToParamMap(params));
  const route = { queryParamMap, snapshot: { queryParams: params } };
  const router = { navigate: vi.fn(() => Promise.resolve(true)) };
  const version = signal(0);
  const expenses = {
    changeVersion: version.asReadonly(),
    list: vi.fn((query: ExpenseQueryParams) => {
      void query;
      return of({ items: [item], meta: { page: 2, pageSize: 20, totalItems: 43, totalPages: 3 } });
    }),
    duplicate: vi.fn(() => of(item)), setStatus: vi.fn(() => of(item)),
    remove: vi.fn(() => of(undefined)), exportCsv: vi.fn(),
  };
  await TestBed.configureTestingModule({
    imports: [ExpensesPageComponent],
    providers: [
      { provide: ExpenseService, useValue: expenses },
      { provide: CategoryService, useValue: { categories: signal([]).asReadonly(), load: vi.fn(() => of([])) } },
      { provide: LabelService, useValue: { labels: signal([]).asReadonly(), load: vi.fn(() => of([])) } },
      { provide: ActivatedRoute, useValue: route },
      { provide: Router, useValue: router },
    ],
  }).compileComponents();
  return { fixture: TestBed.createComponent(ExpensesPageComponent), expenses, router };
}
