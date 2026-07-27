import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, DefaultUrlSerializer, Router } from '@angular/router';
import { BehaviorSubject, NEVER, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { CategoryService } from '../../core/services/category.service';
import { RecurrenceService } from '../../core/services/recurrence.service';
import { SettingsStore } from '../../core/services/settings.store';
import type { RecurrenceRule } from '../../shared/models/recurrence.models';
import { RecurrencesPageComponent } from './recurrences-page.component';

describe('RecurrencesPageComponent', () => {
  it('mostra le note, apre la riga e usa il ciclo di ordinamento a tre stati', async () => {
    const queryParamMap = new BehaviorSubject(convertToParamMap({}));
    const serializer = new DefaultUrlSerializer();
    const router = {
      events: NEVER,
      navigate: vi.fn().mockResolvedValue(true),
      createUrlTree: vi.fn(() => serializer.parse('/recurrences/rule-1')),
      serializeUrl: vi.fn((tree) => serializer.serialize(tree)),
    };
    const service = {
      list: vi.fn(() => of({ items: [rule], meta: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 } })),
      summary: vi.fn(() => of({ activeCount: 1, pausedCount: 0, upcomingOccurrences: 1, upcomingTotal: '850.00', horizonDays: 30 })),
      pause: vi.fn(() => of(rule)),
      resume: vi.fn(() => of(rule)),
      cancel: vi.fn(() => of(rule)),
      remove: vi.fn(() => of(undefined)),
    };
    await TestBed.configureTestingModule({
      imports: [RecurrencesPageComponent],
      providers: [
        { provide: RecurrenceService, useValue: service },
        { provide: CategoryService, useValue: { categories: signal([rule.category]), load: vi.fn(() => of([])) } },
        { provide: SettingsStore, useValue: { ensureLoaded: vi.fn(), experience: signal({ defaultPageSize: 20 }) } },
        { provide: ActivatedRoute, useValue: { queryParamMap, snapshot: {} } },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RecurrencesPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Addebito mensile del canone');
    expect(element.textContent).not.toContain('Descrizione legacy');

    element.querySelector<HTMLTableRowElement>('tbody tr')?.click();
    expect(router.navigate).toHaveBeenCalledWith(['/recurrences', rule.id]);

    const component = fixture.componentInstance;
    router.navigate.mockClear();
    component.sort('name');
    expect(router.navigate).toHaveBeenLastCalledWith([], expect.objectContaining({ queryParams: expect.objectContaining({ sortBy: 'name', sortDirection: 'asc' }) }));
    component.query.set({ sortBy: 'name', sortDirection: 'asc' });
    component.sort('name');
    expect(router.navigate).toHaveBeenLastCalledWith([], expect.objectContaining({ queryParams: expect.objectContaining({ sortBy: 'name', sortDirection: 'desc' }) }));
    component.query.set({ sortBy: 'name', sortDirection: 'desc' });
    component.sort('name');
    expect(router.navigate).toHaveBeenLastCalledWith([], expect.objectContaining({ queryParams: { page: 1 } }));
  });
});

const rule: RecurrenceRule = {
  id: '70000000-0000-4000-8000-000000000001',
  name: 'Affitto casa',
  description: 'Descrizione legacy',
  amount: '850.00',
  merchant: 'Proprietario',
  paymentMethod: 'BANK_TRANSFER',
  notes: 'Addebito mensile del canone',
  frequency: 'MONTHLY',
  interval: 1,
  status: 'ACTIVE',
  startDate: '2026-08-01',
  endDate: null,
  nextOccurrenceDate: '2026-08-01',
  lastGeneratedDate: null,
  maxOccurrences: null,
  generatedCount: 1,
  expenseTime: null,
  generateDaysAhead: 30,
  pausedAt: null,
  completedAt: null,
  cancelledAt: null,
  createdAt: '2026-07-01T08:00:00.000Z',
  updatedAt: '2026-07-01T08:00:00.000Z',
  category: { id: 'category-1', name: 'Affitto', color: '#4F46E5', icon: 'bi-house', isActive: true },
  labels: [],
  reminderTemplates: [],
  exceptions: [],
  expenseCount: 1,
};
