import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import type { ApiEnvelope } from '../auth/auth.models';
import type { CalendarExpenseEvent } from '../../shared/models/calendar.models';
import { CalendarService } from './calendar.service';

const event: CalendarExpenseEvent = {
  id: 'expense-1',
  expenseId: 'expense-1',
  title: 'Affitto',
  amount: '850.00',
  expenseDate: '2026-07-01',
  expenseTime: null,
  allDay: true,
  status: 'COMPLETED',
  isOverdue: false,
  merchant: null,
  category: { id: 'category-1', name: 'Affitto', color: '#9BAFD6', icon: 'bi-house' },
  labels: [],
  paymentMethod: 'BANK_TRANSFER',
  generatedByRecurrence: false,
  recurrence: null,
};

describe('CalendarService', () => {
  let service: CalendarService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CalendarService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('invia intervallo visibile e filtri CSV all’endpoint dedicato', () => {
    service.expenses({
      start: '2026-06-29',
      end: '2026-08-03',
      status: ['PLANNED', 'COMPLETED'],
      categoryId: 'category-1',
      labelIds: ['label-1', 'label-2'],
      paymentMethod: 'CASH',
      search: 'metro',
    }).subscribe((events) => expect(events).toEqual([event]));

    const request = http.expectOne((candidate) =>
      candidate.url === `${environment.apiBaseUrl}/calendar/expenses`,
    );
    expect(request.request.params.get('start')).toBe('2026-06-29');
    expect(request.request.params.get('end')).toBe('2026-08-03');
    expect(request.request.params.get('status')).toBe('PLANNED,COMPLETED');
    expect(request.request.params.get('labelIds')).toBe('label-1,label-2');
    expect(request.request.params.get('categoryId')).toBe('category-1');
    expect(request.request.params.get('paymentMethod')).toBe('CASH');
    expect(request.request.params.get('search')).toBe('metro');
    const envelope: ApiEnvelope<CalendarExpenseEvent[]> = { data: [event], meta: {}, message: '' };
    request.flush(envelope);
  });
});
