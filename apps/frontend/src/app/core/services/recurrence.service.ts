import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import type {
  CreateRecurrenceRequest,
  PaginatedRecurrenceExpenses,
  PaginatedRecurrences,
  RecurrenceExpensesQuery,
  RecurrencePreviewRequest,
  RecurrencePreviewResponse,
  RecurrenceQueryParams,
  RecurrenceRule,
  RecurrenceSummary,
  UpdateRecurrenceRequest,
} from '../../shared/models/recurrence.models';
import type { ApiEnvelope } from '../auth/auth.models';

@Injectable({ providedIn: 'root' })
export class RecurrenceService {
  private readonly http = inject(HttpClient);
  private readonly version = signal(0);
  readonly changeVersion = this.version.asReadonly();

  list(query: RecurrenceQueryParams = {}): Observable<PaginatedRecurrences> {
    return this.http
      .get<ApiEnvelope<RecurrenceRule[]>>(`${environment.apiBaseUrl}/recurrences`, {
        params: paramsFrom(query),
      })
      .pipe(map((response) => ({ items: response.data, meta: pagination(response.meta) })));
  }

  summary(): Observable<RecurrenceSummary> {
    return this.http
      .get<ApiEnvelope<RecurrenceSummary>>(`${environment.apiBaseUrl}/recurrences/summary`)
      .pipe(map((response) => response.data));
  }

  get(id: string): Observable<RecurrenceRule> {
    return this.http
      .get<ApiEnvelope<RecurrenceRule>>(`${environment.apiBaseUrl}/recurrences/${id}`)
      .pipe(map((response) => response.data));
  }

  create(payload: CreateRecurrenceRequest): Observable<RecurrenceRule> {
    return this.http
      .post<ApiEnvelope<RecurrenceRule>>(`${environment.apiBaseUrl}/recurrences`, payload)
      .pipe(map((response) => response.data), tap(() => this.changed()));
  }

  update(id: string, payload: UpdateRecurrenceRequest): Observable<RecurrenceRule> {
    return this.http
      .patch<ApiEnvelope<RecurrenceRule>>(
        `${environment.apiBaseUrl}/recurrences/${id}`,
        payload,
      )
      .pipe(map((response) => response.data), tap(() => this.changed()));
  }

  preview(payload: RecurrencePreviewRequest): Observable<RecurrencePreviewResponse> {
    return this.http
      .post<ApiEnvelope<RecurrencePreviewResponse>>(
        `${environment.apiBaseUrl}/recurrences/preview`,
        payload,
      )
      .pipe(map((response) => response.data));
  }

  previewSaved(id: string, limit = 10): Observable<RecurrencePreviewResponse> {
    return this.http
      .get<ApiEnvelope<RecurrencePreviewResponse>>(
        `${environment.apiBaseUrl}/recurrences/${id}/preview`,
        { params: new HttpParams().set('limit', limit) },
      )
      .pipe(map((response) => response.data));
  }

  expenses(
    id: string,
    query: RecurrenceExpensesQuery = {},
  ): Observable<PaginatedRecurrenceExpenses> {
    return this.http
      .get<ApiEnvelope<PaginatedRecurrenceExpenses['items']>>(
        `${environment.apiBaseUrl}/recurrences/${id}/expenses`,
        { params: paramsFrom(query) },
      )
      .pipe(map((response) => ({ items: response.data, meta: pagination(response.meta) })));
  }

  pause(id: string, cancelFutureExpenses = false): Observable<RecurrenceRule> {
    return this.action(id, 'pause', { cancelFutureExpenses });
  }

  resume(id: string): Observable<RecurrenceRule> {
    return this.action(id, 'resume', {});
  }

  cancel(id: string, cancelFutureExpenses: boolean): Observable<RecurrenceRule> {
    return this.action(id, 'cancel', { cancelFutureExpenses });
  }

  skip(id: string, occurrenceDate: string, reason?: string): Observable<RecurrenceRule> {
    return this.http
      .post<ApiEnvelope<RecurrenceRule>>(
        `${environment.apiBaseUrl}/recurrences/${id}/exceptions`,
        { occurrenceDate, reason: reason?.trim() || null },
      )
      .pipe(map((response) => response.data), tap(() => this.changed()));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<{ deleted: true }>>(`${environment.apiBaseUrl}/recurrences/${id}`)
      .pipe(map(() => undefined), tap(() => this.changed()));
  }

  private action(id: string, action: string, body: object): Observable<RecurrenceRule> {
    return this.http
      .patch<ApiEnvelope<RecurrenceRule>>(
        `${environment.apiBaseUrl}/recurrences/${id}/${action}`,
        body,
      )
      .pipe(map((response) => response.data), tap(() => this.changed()));
  }

  private changed(): void {
    this.version.update((value) => value + 1);
  }
}

function paramsFrom(query: object): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params = params.set(key, String(value));
  }
  return params;
}

function pagination(meta: Record<string, unknown>) {
  return {
    page: numeric(meta['page'], 1),
    pageSize: numeric(meta['pageSize'], 20),
    totalItems: numeric(meta['totalItems'], 0),
    totalPages: numeric(meta['totalPages'], 0),
  };
}

function numeric(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
