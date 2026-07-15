import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { CategoryService } from '../../../core/services/category.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { LabelService } from '../../../core/services/label.service';
import type { ExpenseDetail } from '../../../shared/models/expense.models';
import { QuickExpenseModalComponent } from './quick-expense-modal.component';

const detail: ExpenseDetail = {
  id: '30000000-0000-4000-8000-000000000001', description: 'Test', amount: '10.00',
  expenseDate: '2026-07-14', expenseTime: null, merchant: null, paymentMethod: 'CASH',
  notes: null, status: 'COMPLETED', labels: [], createdAt: '', updatedAt: '',
  category: { id: '10000000-0000-4000-8000-000000000001', name: 'Casa', color: '#4F46E5', icon: 'bi-house', isActive: true },
};

describe('QuickExpenseModalComponent', () => {
  it('si apre e crea una spesa impedendo doppi invii', async () => {
    const create = vi.fn(() => of(detail));
    await TestBed.configureTestingModule({
      imports: [QuickExpenseModalComponent],
      providers: [
        { provide: ExpenseService, useValue: { create } },
        { provide: CategoryService, useValue: { categories: signal([]).asReadonly(), load: vi.fn(() => of([])) } },
        { provide: LabelService, useValue: { labels: signal([]).asReadonly(), load: vi.fn(() => of([])) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(QuickExpenseModalComponent);
    fixture.componentRef.setInput('open', true);
    const created = vi.fn();
    const closed = vi.fn();
    fixture.componentInstance.created.subscribe(created);
    fixture.componentInstance.closed.subscribe(closed);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Nuova spesa');

    fixture.componentInstance.save({
      description: 'Test', amount: '10.00', expenseDate: '2026-07-14',
      categoryId: detail.category.id, paymentMethod: 'CASH', status: 'COMPLETED',
    });
    expect(create).toHaveBeenCalledTimes(1);
    expect(created).toHaveBeenCalledWith(detail);
    expect(closed).toHaveBeenCalled();
  });
});
