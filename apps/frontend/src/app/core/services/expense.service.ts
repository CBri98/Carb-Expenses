import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiEnvelope } from '../auth/auth.models';
import type {
  CreateExpenseRequest,
  DuplicateExpenseRequest,
  ExpenseDetail,
  ExpenseExportResult,
  ExpenseListItem,
  ExpenseQueryParams,
  ExpenseStatus,
  PaginatedExpenseResponse,
  PaginationMeta,
  UpdateExpenseRequest,
} from '../../shared/models/expense.models';

@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private readonly http = inject(HttpClient);
  private readonly version = signal(0);
  readonly changeVersion = this.version.asReadonly();

  list(query: ExpenseQueryParams = {}): Observable<PaginatedExpenseResponse> {
    return this.http
      .get<ApiEnvelope<ExpenseListItem[]>>(`${environment.apiBaseUrl}/expenses`, {
        params: expenseParams(query),
      })
      .pipe(map((response) => ({ items: response.data, meta: paginationMeta(response.meta) })));
  }

  get(id: string): Observable<ExpenseDetail> {
    return this.http
      .get<ApiEnvelope<ExpenseDetail>>(`${environment.apiBaseUrl}/expenses/${id}`)
      .pipe(map((response) => response.data));
  }

  create(payload: CreateExpenseRequest): Observable<ExpenseDetail> {
    return this.http
      .post<ApiEnvelope<ExpenseDetail>>(`${environment.apiBaseUrl}/expenses`, payload)
      .pipe(map((response) => response.data), tap(() => this.markChanged()));
  }

  update(id: string, payload: UpdateExpenseRequest): Observable<ExpenseDetail> {
    return this.http
      .patch<ApiEnvelope<ExpenseDetail>>(`${environment.apiBaseUrl}/expenses/${id}`, payload)
      .pipe(map((response) => response.data), tap(() => this.markChanged()));
  }

  setStatus(id: string, status: ExpenseStatus): Observable<ExpenseDetail> {
    return this.http
      .patch<ApiEnvelope<ExpenseDetail>>(`${environment.apiBaseUrl}/expenses/${id}/status`, {
        status,
      })
      .pipe(map((response) => response.data), tap(() => this.markChanged()));
  }

  duplicate(id: string, payload: DuplicateExpenseRequest = {}): Observable<ExpenseDetail> {
    return this.http
      .post<ApiEnvelope<ExpenseDetail>>(
        `${environment.apiBaseUrl}/expenses/${id}/duplicate`,
        payload,
      )
      .pipe(map((response) => response.data), tap(() => this.markChanged()));
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<{ deleted: true }>>(`${environment.apiBaseUrl}/expenses/${id}`)
      .pipe(map(() => undefined), tap(() => this.markChanged()));
  }

  exportCsv(query: ExpenseQueryParams): Observable<ExpenseExportResult> {
    const exportQuery = { ...query };
    delete exportQuery.page;
    delete exportQuery.pageSize;
    return this.http
      .get(`${environment.apiBaseUrl}/expenses/export`, {
        params: expenseParams(exportQuery),
        observe: 'response',
        responseType: 'blob',
      })
      .pipe(map((response) => exportResult(response)));
  }

  private markChanged(): void {
    this.version.update((value) => value + 1);
  }
}

function expenseParams(query: ExpenseQueryParams): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) continue;
    params = params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  return params;
}

function paginationMeta(meta: Record<string, unknown>): PaginationMeta {
  return {
    page: numericMeta(meta['page'], 1),
    pageSize: numericMeta(meta['pageSize'], 20),
    totalItems: numericMeta(meta['totalItems'], 0),
    totalPages: numericMeta(meta['totalPages'], 0),
  };
}

function numericMeta(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function exportResult(response: HttpResponse<Blob>): ExpenseExportResult {
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? 'spese.csv';
  return { blob: response.body ?? new Blob([], { type: 'text/csv' }), filename };
}
