import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, DefaultUrlSerializer, Router } from '@angular/router';
import { NEVER, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { RecurrenceService } from '../../core/services/recurrence.service';
import type { ExpenseListItem } from '../../shared/models/expense.models';
import type { RecurrenceRule } from '../../shared/models/recurrence.models';
import { RecurrenceDetailComponent } from './recurrence-detail.component';

describe('RecurrenceDetailComponent', () => {
  it('separa informazioni, occorrenze e promemoria in tab accessibili', async () => {
    const serializer = new DefaultUrlSerializer();
    const router = {
      events: NEVER,
      navigate: vi.fn().mockResolvedValue(true),
      getCurrentNavigation: vi.fn(() => null),
      createUrlTree: vi.fn(() => serializer.parse('/recurrences/rule-1/edit')),
      serializeUrl: vi.fn((tree) => serializer.serialize(tree)),
    };
    const service = {
      get: vi.fn(() => of(rule)),
      expenses: vi.fn(() => of({ items: [expense], meta: { page: 1, pageSize: 10, totalItems: 1, totalPages: 1 } })),
    };
    await TestBed.configureTestingModule({
      imports: [RecurrenceDetailComponent],
      providers: [
        { provide: RecurrenceService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: rule.id }) } } },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RecurrenceDetailComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('#recurrence-panel-general')).not.toBeNull();
    expect(element.textContent).toContain(rule.notes);

    element.querySelector<HTMLButtonElement>('#recurrence-tab-occurrences')?.click();
    fixture.detectChanges();
    expect(element.querySelector('#recurrence-panel-occurrences')).not.toBeNull();
    expect(element.textContent).toContain(expense.description);

    element.querySelector<HTMLButtonElement>('#recurrence-tab-reminders')?.click();
    fixture.detectChanges();
    expect(element.querySelector('#recurrence-panel-reminders')).not.toBeNull();
    expect(element.textContent).toContain('3 giorni prima');
  });
});

const rule: RecurrenceRule = {
  id: '70000000-0000-4000-8000-000000000001', name: 'Affitto casa', description: 'Affitto casa', amount: '850.00', merchant: 'Proprietario', paymentMethod: 'BANK_TRANSFER', notes: 'Contratto abitazione principale', frequency: 'MONTHLY', interval: 1, status: 'ACTIVE', startDate: '2026-08-01', endDate: null, nextOccurrenceDate: '2026-08-01', lastGeneratedDate: '2026-07-01', maxOccurrences: null, generatedCount: 1, expenseTime: '09:00', generateDaysAhead: 30, pausedAt: null, completedAt: null, cancelledAt: null, createdAt: '2026-07-01T08:00:00.000Z', updatedAt: '2026-07-01T08:00:00.000Z', category: { id: 'category-1', name: 'Affitto', color: '#4F46E5', icon: 'bi-house', isActive: true }, labels: [], reminderTemplates: [{ id: 'reminder-1', type: 'THREE_DAYS_BEFORE', offsetMinutes: 4320, reminderTime: '09:00' }], exceptions: [], expenseCount: 1, previewDates: ['2026-08-01'],
};

const expense: ExpenseListItem = {
  id: 'expense-1', description: 'Affitto casa', amount: '850.00', expenseDate: '2026-08-01', expenseTime: null, merchant: 'Proprietario', paymentMethod: 'BANK_TRANSFER', notes: null, status: 'PLANNED', category: { id: 'category-1', name: 'Affitto', color: '#4F46E5', icon: 'bi-house', isActive: true }, labels: [], createdAt: '2026-07-01T08:00:00.000Z', updatedAt: '2026-07-01T08:00:00.000Z', generatedByRecurrence: true, occurrenceDate: '2026-08-01', recurrence: { id: rule.id, name: rule.name, status: rule.status }, nextReminderAt: null, activeReminderCount: 0,
};
