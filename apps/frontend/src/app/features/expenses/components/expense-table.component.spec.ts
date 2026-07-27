import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import type { ExpenseListItem } from '../../../shared/models/expense.models';
import { ExpenseActionsMenuComponent } from './expense-actions-menu.component';
import { ExpenseTableComponent } from './expense-table.component';

const planned: ExpenseListItem = {
  id: '30000000-0000-4000-8000-000000000001',
  description: 'Affitto pianificato',
  amount: '800.00',
  expenseDate: '2026-08-01',
  expenseTime: null,
  merchant: null,
  paymentMethod: 'BANK_TRANSFER',
  notes: null,
  status: 'PLANNED',
  labels: [],
  createdAt: '2026-07-01T08:00:00.000Z',
  updatedAt: '2026-07-01T08:00:00.000Z',
  category: {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Affitto',
    color: '#4F46E5',
    icon: 'bi-house',
    isActive: true,
  },
  generatedByRecurrence: false,
  occurrenceDate: null,
  recurrence: null,
  nextReminderAt: null,
  activeReminderCount: 0,
};

describe('ExpenseTableComponent', () => {
  it('apre il dettaglio al click o da tastiera ed evidenzia le pianificate', async () => {
    await TestBed.configureTestingModule({ imports: [ExpenseTableComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ExpenseTableComponent);
    fixture.componentRef.setInput('expenses', [planned]);
    const opened = vi.fn();
    fixture.componentInstance.view.subscribe(opened);
    fixture.detectChanges();

    const row = (fixture.nativeElement as HTMLElement).querySelector<HTMLTableRowElement>('tbody tr');
    expect(row?.classList.contains('expense-row--planned')).toBe(true);
    row?.click();
    expect(opened).toHaveBeenCalledWith(planned);

    row?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(opened).toHaveBeenCalledTimes(2);
  });

  it('espone aria-sort e icone neutre per le colonne non ordinate', async () => {
    await TestBed.configureTestingModule({ imports: [ExpenseTableComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ExpenseTableComponent);
    fixture.componentRef.setInput('expenses', [planned]);
    fixture.componentRef.setInput('sortBy', 'amount');
    fixture.componentRef.setInput('sortDirection', 'asc');
    fixture.detectChanges();
    const headers = (fixture.nativeElement as HTMLElement).querySelectorAll('thead th');
    expect(headers[0]?.getAttribute('aria-sort')).toBe('none');
    expect(headers[2]?.getAttribute('aria-sort')).toBe('ascending');
    expect(headers[0]?.querySelector('.bi-arrow-down-up')).not.toBeNull();
  });
});

describe('ExpenseActionsMenuComponent', () => {
  it('aggancia il menu al body e lo chiude al click esterno', async () => {
    await TestBed.configureTestingModule({ imports: [ExpenseActionsMenuComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ExpenseActionsMenuComponent);
    fixture.componentRef.setInput('expense', planned);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')?.click();
    fixture.detectChanges();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    const selector = '#expense-actions-' + planned.id;
    const panel = document.body.querySelector<HTMLElement>(selector);
    expect(panel).not.toBeNull();
    expect(panel?.parentElement).toBe(document.body);

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    fixture.detectChanges();
    expect(document.body.querySelector(selector)).toBeNull();
    fixture.destroy();
  });
});
