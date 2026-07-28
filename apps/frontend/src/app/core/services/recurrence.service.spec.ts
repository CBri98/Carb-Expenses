import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import type { ApiEnvelope } from '../auth/auth.models';
import type {
  CreateRecurrenceRequest,
  RecurrenceRule,
  RecurrenceSummary,
} from '../../shared/models/recurrence.models';
import { RecurrenceService } from './recurrence.service';

const rule: RecurrenceRule = {
  id: '70000000-0000-4000-8000-000000000001',
  name: 'Affitto',
  description: 'Affitto mensile',
  amount: '850.00',
  merchant: 'Proprietario',
  paymentMethod: 'BANK_TRANSFER',
  notes: null,
  frequency: 'MONTHLY',
  interval: 1,
  status: 'ACTIVE',
  startDate: '2026-07-01',
  endDate: null,
  nextOccurrenceDate: '2026-08-01',
  lastGeneratedDate: '2026-07-01',
  maxOccurrences: null,
  generatedCount: 1,
  expenseTime: '09:00',
  generateDaysAhead: 30,
  pausedAt: null,
  completedAt: null,
  cancelledAt: null,
  createdAt: '2026-07-01T08:00:00.000Z',
  updatedAt: '2026-07-01T08:00:00.000Z',
  category: {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Affitto',
    color: '#4F46E5',
    icon: 'bi-house',
    isActive: true,
  },
  labels: [],
  reminderTemplates: [],
  exceptions: [],
  expenseCount: 1,
};

const createPayload: CreateRecurrenceRequest = {
  name: rule.name,
  description: rule.description,
  amount: rule.amount,
  categoryId: rule.category.id,
  labelIds: [],
  paymentMethod: rule.paymentMethod,
  frequency: rule.frequency,
  interval: rule.interval,
  startDate: rule.startDate,
  generateDaysAhead: rule.generateDaysAhead,
  reminderTemplates: [],
};

describe('RecurrenceService', () => {
  let service: RecurrenceService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RecurrenceService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('invia filtri e restituisce la paginazione server-side', () => {
    service.list({ page: 2, status: 'ACTIVE', frequency: 'MONTHLY' }).subscribe((result) => {
      expect(result.items).toEqual([rule]);
      expect(result.meta.totalPages).toBe(2);
    });
    const request = http.expectOne((candidate) =>
      candidate.url === `${environment.apiBaseUrl}/recurrences` &&
      candidate.params.get('page') === '2' &&
      candidate.params.get('status') === 'ACTIVE' &&
      candidate.params.get('frequency') === 'MONTHLY',
    );
    const response: ApiEnvelope<RecurrenceRule[]> = {
      data: [rule],
      meta: { page: 2, pageSize: 20, totalItems: 21, totalPages: 2 },
      message: '',
    };
    request.flush(response);
  });

  it('invia i filtri anche al riepilogo', () => {
    service.summary({ status: 'ACTIVE', categoryId: rule.category.id }).subscribe((result) => {
      expect(result.activeCount).toBe(1);
    });
    const request = http.expectOne((candidate) =>
      candidate.url === `${environment.apiBaseUrl}/recurrences/summary`
      && candidate.params.get('status') === 'ACTIVE'
      && candidate.params.get('categoryId') === rule.category.id,
    );
    const summary: RecurrenceSummary = {
      activeCount: 1,
      pausedCount: 0,
      upcomingOccurrences: 1,
      upcomingTotal: '850.00',
      horizonDays: 30,
    };
    request.flush({ data: summary, meta: {}, message: '' });
  });

  it('calcola anteprima senza mutare la versione locale', () => {
    const before = service.changeVersion();
    service.preview({
      frequency: 'MONTHLY',
      interval: 1,
      startDate: '2026-01-31',
      limit: 3,
    }).subscribe((result) => expect(result.dates).toEqual([
      '2026-01-31',
      '2026-02-28',
      '2026-03-31',
    ]));
    const request = http.expectOne(`${environment.apiBaseUrl}/recurrences/preview`);
    expect(request.request.method).toBe('POST');
    request.flush({ data: { dates: ['2026-01-31', '2026-02-28', '2026-03-31'] }, meta: {}, message: '' });
    expect(service.changeVersion()).toBe(before);
  });

  it('creazione e azioni aggiornano la versione condivisa', () => {
    const initial = service.changeVersion();
    service.create(createPayload).subscribe((created) => expect(created).toEqual(rule));
    const create = http.expectOne(`${environment.apiBaseUrl}/recurrences`);
    expect(create.request.body).toEqual(createPayload);
    create.flush({ data: rule, meta: {}, message: '' });
    expect(service.changeVersion()).toBe(initial + 1);

    service.cancel(rule.id, true).subscribe();
    const cancel = http.expectOne(`${environment.apiBaseUrl}/recurrences/${rule.id}/cancel`);
    expect(cancel.request.body).toEqual({ cancelFutureExpenses: true });
    cancel.flush({ data: { ...rule, status: 'CANCELLED' }, meta: {}, message: '' });
    expect(service.changeVersion()).toBe(initial + 2);
  });
});
