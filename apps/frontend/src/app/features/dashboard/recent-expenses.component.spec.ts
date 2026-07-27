import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import type { RecentExpense } from '../../shared/models/dashboard.models';
import { RecentExpensesComponent } from './recent-expenses.component';

const expense: RecentExpense = {
  id: '30000000-0000-4000-8000-000000000001',
  description: 'Bolletta futura',
  amount: '65.00',
  expenseDate: '2026-08-02',
  expenseTime: null,
  merchant: null,
  paymentMethod: 'DIRECT_DEBIT',
  notes: null,
  status: 'PLANNED',
  labels: [],
  createdAt: '2026-07-01T08:00:00.000Z',
  updatedAt: '2026-07-01T08:00:00.000Z',
  category: { id: 'category-1', name: 'Bollette', color: '#4F46E5', icon: 'bi-lightning', isActive: true },
  generatedByRecurrence: false,
  occurrenceDate: null,
  recurrence: null,
  nextReminderAt: null,
  activeReminderCount: 0,
};

describe('RecentExpensesComponent', () => {
  it('apre il dettaglio dal click sulla riga e distingue le pianificate', async () => {
    await TestBed.configureTestingModule({
      imports: [RecentExpensesComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(RecentExpensesComponent);
    fixture.componentRef.setInput('expenses', [expense]);
    fixture.detectChanges();

    const row = (fixture.nativeElement as HTMLElement).querySelector<HTMLTableRowElement>('tbody tr');
    expect(row?.classList.contains('recent-row--planned')).toBe(true);
    row?.click();
    expect(router.navigate).toHaveBeenCalledWith(['/expenses', expense.id]);
  });
});
