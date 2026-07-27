import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import type { ExpenseReminder } from '../../shared/models/notification.models';
import { ExpenseReminderService } from './expense-reminder.service';

const reminder: ExpenseReminder = {
  id: '50000000-0000-4000-8000-000000000001', type: 'THREE_DAYS_BEFORE',
  offsetMinutes: 4320, scheduledAt: '2099-07-17T07:00:00Z', isActive: true,
  processedAt: null, cancelledAt: null, createdAt: '', updatedAt: '',
};

describe('ExpenseReminderService', () => {
  let service: ExpenseReminderService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ExpenseReminderService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('sincronizza preset multipli senza ricreare quelli invariati', () => {
    service.sync('expense-1', [reminder], [
      { type: 'THREE_DAYS_BEFORE' },
      { type: 'SAME_DAY' },
    ]).subscribe();
    const request = http.expectOne(`${environment.apiBaseUrl}/expenses/expense-1/reminders`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ type: 'SAME_DAY' });
    request.flush({ data: { ...reminder, id: 'reminder-2', type: 'SAME_DAY' }, meta: {}, message: '' });
  });

  it('disattiva un reminder rimosso dalla selezione', () => {
    service.sync('expense-1', [reminder], []).subscribe();
    const request = http.expectOne(`${environment.apiBaseUrl}/expenses/expense-1/reminders/${reminder.id}`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
