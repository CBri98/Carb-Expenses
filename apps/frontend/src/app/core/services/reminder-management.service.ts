import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type {
  ManagedReminder,
  PaginatedReminders,
  ReminderBulkResult,
  ReminderQueryParams,
  ReminderSummary,
  ReminderUpdateRequest,
} from '../../shared/models/reminder-management.models';
import type { PaginationMeta } from '../../shared/models/expense.models';
import type { ApiEnvelope } from '../auth/auth.models';

@Injectable({ providedIn: 'root' })
export class ReminderManagementService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiBaseUrl}/reminders`;

  list(query: ReminderQueryParams = {}): Observable<PaginatedReminders> {
    return this.http.get<ApiEnvelope<ManagedReminder[]>>(this.url, { params: paramsFrom(query) })
      .pipe(map((response) => ({ items: response.data, meta: pagination(response.meta) })));
  }

  summary(upcomingDays = 7): Observable<ReminderSummary> {
    return this.http.get<ApiEnvelope<ReminderSummary>>(`${this.url}/summary`, {
      params: new HttpParams().set('upcomingDays', upcomingDays),
    }).pipe(map((response) => response.data));
  }

  get(id: string): Observable<ManagedReminder> {
    return this.http.get<ApiEnvelope<ManagedReminder>>(`${this.url}/${id}`)
      .pipe(map((response) => response.data));
  }

  update(id: string, payload: ReminderUpdateRequest): Observable<ManagedReminder> {
    return this.http.patch<ApiEnvelope<ManagedReminder>>(`${this.url}/${id}`, payload)
      .pipe(map((response) => response.data));
  }

  cancel(id: string): Observable<ManagedReminder> {
    return this.action(id, 'cancel');
  }

  reactivate(id: string): Observable<ManagedReminder> {
    return this.action(id, 'reactivate');
  }

  remove(id: string): Observable<void> {
    return this.http.delete<ApiEnvelope<{ deleted: true }>>(`${this.url}/${id}`)
      .pipe(map(() => undefined));
  }

  bulk(ids: string[], action: 'cancel' | 'reactivate' | 'delete'): Observable<ReminderBulkResult> {
    const request = action === 'delete'
      ? this.http.delete<ApiEnvelope<ReminderBulkResult>>(`${this.url}/bulk`, { body: { ids } })
      : this.http.patch<ApiEnvelope<ReminderBulkResult>>(`${this.url}/bulk/${action}`, { ids });
    return request.pipe(map((response) => response.data));
  }

  private action(id: string, action: string): Observable<ManagedReminder> {
    return this.http.patch<ApiEnvelope<ManagedReminder>>(`${this.url}/${id}/${action}`, {})
      .pipe(map((response) => response.data));
  }
}

function paramsFrom(query: ReminderQueryParams): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params = params.set(key, String(value));
  }
  return params;
}

function pagination(meta: Record<string, unknown>): PaginationMeta {
  return {
    page: numberValue(meta['page'], 1),
    pageSize: numberValue(meta['pageSize'], 20),
    totalItems: numberValue(meta['totalItems'], 0),
    totalPages: numberValue(meta['totalPages'], 0),
  };
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
