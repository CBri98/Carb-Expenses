import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import type { ApiEnvelope } from '../auth/auth.models';
import type { AppNotification } from '../../shared/models/notification.models';
import { NotificationService } from './notification.service';

const notification: AppNotification = {
  id: '60000000-0000-4000-8000-000000000001', type: 'EXPENSE_REMINDER', status: 'UNREAD',
  title: 'Spesa in scadenza', message: 'Messaggio', scheduledAt: '2026-07-18T07:00:00Z',
  readAt: null, archivedAt: null, createdAt: '2026-07-18T07:00:00Z', expense: null, reminder: null,
};

describe('NotificationService', () => {
  let service: NotificationService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(NotificationService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('usa COUNT dedicato e aggiorna il signal del badge', () => {
    service.refreshUnreadCount().subscribe((count) => expect(count).toBe(4));
    const request = http.expectOne(`${environment.apiBaseUrl}/notifications/unread-count`);
    request.flush({ data: { count: 4 }, meta: {}, message: '' });
    expect(service.unreadCount()).toBe(4);
  });

  it('serializza filtri e paginazione senza valori vuoti', () => {
    service.list({ page: 2, status: 'UNREAD', type: 'EXPENSE_REMINDER', dateFrom: '' }).subscribe((result) => {
      expect(result.items).toEqual([notification]);
      expect(result.meta.totalItems).toBe(1);
    });
    const request = http.expectOne((candidate) => candidate.url === `${environment.apiBaseUrl}/notifications`);
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('status')).toBe('UNREAD');
    expect(request.request.params.has('dateFrom')).toBe(false);
    const envelope: ApiEnvelope<AppNotification[]> = {
      data: [notification], meta: { page: 2, pageSize: 20, totalItems: 1, totalPages: 1 }, message: '',
    };
    request.flush(envelope);
  });

  it('aggiorna immediatamente il conteggio dopo lettura, tutte e archiviazione', () => {
    service.refreshUnreadCount().subscribe();
    http.expectOne(`${environment.apiBaseUrl}/notifications/unread-count`).flush({ data: { count: 3 }, meta: {}, message: '' });
    service.markRead(notification.id, true).subscribe();
    http.expectOne(`${environment.apiBaseUrl}/notifications/${notification.id}/read`).flush({ data: { ...notification, status: 'READ' }, meta: {}, message: '' });
    expect(service.unreadCount()).toBe(2);
    service.archive(notification.id, true).subscribe();
    http.expectOne(`${environment.apiBaseUrl}/notifications/${notification.id}/archive`).flush({ data: { ...notification, status: 'ARCHIVED' }, meta: {}, message: '' });
    expect(service.unreadCount()).toBe(1);
    service.markAllRead().subscribe();
    http.expectOne(`${environment.apiBaseUrl}/notifications/read-all`).flush({ data: { updatedCount: 1 }, meta: {}, message: '' });
    expect(service.unreadCount()).toBe(0);
  });

  it('disarchivia tramite l’endpoint dedicato senza aumentare il badge', () => {
    service.unarchive(notification.id).subscribe((updated) => expect(updated.status).toBe('READ'));
    http.expectOne(`${environment.apiBaseUrl}/notifications/${notification.id}/unarchive`).flush({
      data: { ...notification, status: 'READ', readAt: '2026-07-18T08:00:00Z', archivedAt: null },
      meta: {},
      message: '',
    });
    expect(service.unreadCount()).toBe(0);
  });
});
