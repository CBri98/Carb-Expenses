import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { CalendarService } from '../../core/services/calendar.service';
import { CategoryService } from '../../core/services/category.service';
import { ExpenseService } from '../../core/services/expense.service';
import { LabelService } from '../../core/services/label.service';
import type { CalendarExpenseEvent } from '../../shared/models/calendar.models';
import type { ExpenseDetail } from '../../shared/models/expense.models';
import { CalendarExpenseEventComponent } from './calendar-expense-event.component';
import { CalendarPageComponent } from './calendar-page.component';

const planned: CalendarExpenseEvent = {
  id: 'expense-1',
  expenseId: 'expense-1',
  title: 'Assicurazione',
  amount: '120.00',
  expenseDate: '2026-07-10',
  expenseTime: null,
  allDay: true,
  status: 'PLANNED',
  isOverdue: true,
  merchant: null,
  category: {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Auto',
    color: '#9BAFD6',
    icon: 'bi-car-front',
  },
  labels: [],
  paymentMethod: 'DIRECT_DEBIT',
};
const completed: ExpenseDetail = {
  id: planned.id,
  description: planned.title,
  amount: planned.amount,
  expenseDate: planned.expenseDate,
  expenseTime: null,
  merchant: null,
  paymentMethod: planned.paymentMethod,
  notes: null,
  status: 'COMPLETED',
  category: { ...planned.category, isActive: true },
  labels: [],
  createdAt: '2026-07-01T08:00:00.000Z',
  updatedAt: '2026-07-16T08:00:00.000Z',
};

describe('CalendarExpenseEventComponent', () => {
  it('rende stato e scadenza testuali e rende trascinabile soltanto PLANNED', async () => {
    await TestBed.configureTestingModule({ imports: [CalendarExpenseEventComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CalendarExpenseEventComponent);
    fixture.componentRef.setInput('event', planned);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Pianificata');
    expect(element.textContent).toContain('Scaduta');
    expect(element.querySelector('.calendar-event')?.getAttribute('draggable')).toBe('true');

    fixture.componentRef.setInput('event', { ...planned, status: 'COMPLETED', isOverdue: false });
    fixture.detectChanges();
    expect(element.querySelector('.calendar-event')?.hasAttribute('draggable')).toBe(false);
  });
});

describe('CalendarPageComponent', () => {
  it('carica dall’URL, sincronizza i filtri e precompila data e ora della creazione', async () => {
    const context = await setupPage();
    const component = context.fixture.componentInstance;
    expect(context.calendar.expenses).toHaveBeenCalledWith(expect.objectContaining({
      start: '2026-06-29',
      end: '2026-08-03',
      status: ['PLANNED', 'COMPLETED'],
    }));

    component.updateCategory('10000000-0000-4000-8000-000000000001');
    expect(context.router.navigate).toHaveBeenCalledWith([], expect.objectContaining({
      queryParams: expect.objectContaining({
        view: 'month',
        date: '2026-07-16',
        categoryId: '10000000-0000-4000-8000-000000000001',
      }),
    }));

    component.openCreate('2026-07-21', '09:00');
    expect(component.quickOpen()).toBe(true);
    expect(component.selectedDate()).toBe('2026-07-21');
    expect(component.selectedTime()).toBe('09:00');
  });

  it('aggiorna rapidamente lo stato usando ExpenseService', async () => {
    const context = await setupPage({ setStatus: vi.fn(() => of(completed)) });
    const component = context.fixture.componentInstance;
    component.changeStatus(planned, 'COMPLETED');
    expect(context.expenses.setStatus).toHaveBeenCalledWith('expense-1', 'COMPLETED');
    expect(component.events()[0]?.status).toBe('COMPLETED');
    expect(component.events()[0]?.isOverdue).toBe(false);
  });

  it('ripristina lo snapshot originale quando lo spostamento pianificato fallisce', async () => {
    const context = await setupPage({
      update: vi.fn(() => throwError(() => new Error('rete non disponibile'))),
    });
    const component = context.fixture.componentInstance;
    component.startDrag(planned.id);
    component.dropOn('2026-07-22', {
      preventDefault: vi.fn(),
      dataTransfer: null,
    } as unknown as DragEvent);

    expect(context.expenses.update).toHaveBeenCalledWith('expense-1', {
      expenseDate: '2026-07-22',
    });
    expect(component.events()[0]?.expenseDate).toBe('2026-07-10');
    expect(component.error()).toContain('data originale è stata ripristinata');
  });
});

async function setupPage(overrides: {
  update?: ReturnType<typeof vi.fn>;
  setStatus?: ReturnType<typeof vi.fn>;
} = {}) {
  const changeVersion = signal(0);
  const expenses = {
    changeVersion: changeVersion.asReadonly(),
    update: overrides.update ?? vi.fn(() => of(completed)),
    setStatus: overrides.setStatus ?? vi.fn(() => of(completed)),
  };
  const calendar = { expenses: vi.fn(() => of([planned])) };
  const router = { navigate: vi.fn().mockResolvedValue(true) };

  await TestBed.configureTestingModule({
    imports: [CalendarPageComponent],
    providers: [
      { provide: CalendarService, useValue: calendar },
      { provide: ExpenseService, useValue: expenses },
      { provide: CategoryService, useValue: { categories: signal([]), load: vi.fn(() => of([])) } },
      { provide: LabelService, useValue: { labels: signal([]), load: vi.fn(() => of([])) } },
      {
        provide: ActivatedRoute,
        useValue: {
          queryParamMap: of(convertToParamMap({
            view: 'month',
            date: '2026-07-16',
            status: 'PLANNED,COMPLETED',
          })),
        },
      },
      { provide: Router, useValue: router },
    ],
  })
    .overrideComponent(CalendarPageComponent, { set: { template: '' } })
    .compileComponents();

  const fixture = TestBed.createComponent(CalendarPageComponent);
  fixture.detectChanges();
  return { fixture, expenses, calendar, router };
}
