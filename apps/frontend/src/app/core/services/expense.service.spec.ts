import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import type { ApiEnvelope } from '../auth/auth.models';
import type { ExpenseListItem } from '../../shared/models/expense.models';
import { ExpenseService } from './expense.service';

const item: ExpenseListItem = {
  id: 'expense-1', description: 'Test', amount: '10.00', expenseDate: '2026-07-14',
  expenseTime: null, merchant: null, paymentMethod: 'CASH', notes: null, status: 'COMPLETED',
  category: { id: 'category-1', name: 'Casa', color: '#4F46E5', icon: 'bi-house', isActive: true },
  labels: [], createdAt: '', updatedAt: '',
  generatedByRecurrence: false, occurrenceDate: null, recurrence: null,
  nextReminderAt: null, activeReminderCount: 0,
};

describe('ExpenseService', () => {
  let service: ExpenseService;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ExpenseService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('invia filtri e legge la paginazione dal meta', () => {
    service.list({ page: 2, month: 7, year: 2026, labelIds: ['a', 'b'] }).subscribe((result) => {
      expect(result.items).toEqual([item]);
      expect(result.meta).toEqual({ page: 2, pageSize: 20, totalItems: 21, totalPages: 2 });
    });
    const request = http.expectOne((candidate) =>
      candidate.url === `${environment.apiBaseUrl}/expenses` &&
      candidate.params.get('labelIds') === 'a,b',
    );
    const response: ApiEnvelope<ExpenseListItem[]> = {
      data: [item], meta: { page: 2, pageSize: 20, totalItems: 21, totalPages: 2 }, message: '',
    };
    request.flush(response);
  });

  it('richiede export CSV senza paginazione e legge il nome file', () => {
    service.exportCsv({ page: 3, search: 'test' }).subscribe((result) => {
      expect(result.filename).toBe('spese-test.csv');
      expect(result.blob.type).toBe('text/csv');
    });
    const request = http.expectOne((candidate) =>
      candidate.url === `${environment.apiBaseUrl}/expenses/export` &&
      !candidate.params.has('page') && candidate.params.get('search') === 'test',
    );
    request.flush(new Blob(['csv'], { type: 'text/csv' }), {
      headers: { 'Content-Disposition': 'attachment; filename="spese-test.csv"' },
    });
  });

  it('richiede i contatori con gli stessi filtri ma senza paginazione', () => {
    service.summary({ page: 3, categoryIds: ['a', 'b'], recurrenceMode: 'ONLY' }).subscribe((result) => {
      expect(result.totalResults).toBe(4);
    });
    const request = http.expectOne((candidate) =>
      candidate.url === `${environment.apiBaseUrl}/expenses/summary` &&
      !candidate.params.has('page') &&
      candidate.params.get('categoryIds') === 'a,b' &&
      candidate.params.get('recurrenceMode') === 'ONLY',
    );
    request.flush({ data: { totalResults: 4, completed: 1, planned: 2, cancelled: 1 }, meta: {}, message: '' });
  });
});
