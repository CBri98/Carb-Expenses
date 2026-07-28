import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import type { ManagedReminder } from '../../shared/models/reminder-management.models';
import { ReminderManagementService } from './reminder-management.service';

describe('ReminderManagementService', () => {
  let service: ReminderManagementService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ReminderManagementService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('serializza tutti i filtri e conserva la paginazione server-side', () => {
    service.list({
      page: 2,
      pageSize: 50,
      search: 'auto',
      status: 'UPCOMING',
      source: 'RECURRENCE',
      categoryId: 'category-1',
      scheduledFrom: '2026-07-28T08:00:00.000Z',
    }).subscribe((response) => {
      expect(response.items).toEqual([managedReminder]);
      expect(response.meta).toEqual({ page: 2, pageSize: 50, totalItems: 1, totalPages: 1 });
    });
    const request = http.expectOne((candidate) => candidate.url === `${environment.apiBaseUrl}/reminders`);
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('status')).toBe('UPCOMING');
    expect(request.request.params.get('source')).toBe('RECURRENCE');
    expect(request.request.params.get('scheduledFrom')).toBe('2026-07-28T08:00:00.000Z');
    request.flush({
      data: [managedReminder],
      meta: { page: 2, pageSize: 50, totalItems: 1, totalPages: 1 },
      message: '',
    });
  });

  it('usa gli endpoint dedicati per modifica e azioni massive', () => {
    service.update(managedReminder.id, { type: 'CUSTOM', scheduledAt: '2026-08-01T09:00:00+02:00' }).subscribe();
    const update = http.expectOne(`${environment.apiBaseUrl}/reminders/${managedReminder.id}`);
    expect(update.request.method).toBe('PATCH');
    expect(update.request.body).toEqual({ type: 'CUSTOM', scheduledAt: '2026-08-01T09:00:00+02:00' });
    update.flush({ data: managedReminder, meta: {}, message: '' });

    service.bulk([managedReminder.id], 'delete').subscribe((result) => expect(result.updatedCount).toBe(1));
    const bulk = http.expectOne(`${environment.apiBaseUrl}/reminders/bulk`);
    expect(bulk.request.method).toBe('DELETE');
    expect(bulk.request.body).toEqual({ ids: [managedReminder.id] });
    bulk.flush({
      data: { requestedCount: 1, updatedCount: 1, skippedCount: 0, errors: [] },
      meta: {},
      message: '',
    });
  });
});

const managedReminder = {
  id: '50000000-0000-4000-8000-000000000001',
  type: 'THREE_DAYS_BEFORE',
  source: 'MANUAL',
  status: 'UPCOMING',
  offsetMinutes: 4320,
  scheduledAt: '2026-08-01T07:00:00.000Z',
  isActive: true,
  processedAt: null,
  cancelledAt: null,
  createdAt: '2026-07-28T10:00:00.000Z',
  updatedAt: '2026-07-28T10:00:00.000Z',
  expense: {
    id: 'expense-1',
    description: 'Assicurazione auto',
    amount: '320.00',
    expenseDate: '2026-08-04',
    expenseTime: null,
    merchant: null,
    status: 'PLANNED',
    deletedAt: null,
    category: { id: 'category-1', name: 'Auto', color: '#2563EB', icon: 'bi-car-front' },
    labels: [],
    recurrence: null,
  },
  notification: null,
  allowedActions: { canEdit: true, canCancel: true, canReactivate: false, canDelete: true },
} satisfies ManagedReminder;
