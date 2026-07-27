import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiEnvelope } from '../auth/auth.models';
import type {
  CreateLabelRequest,
  Label,
  LabelQueryParams,
  LabelSummary,
  ReorderItem,
  UpdateLabelRequest,
} from '../../shared/models/catalog.models';

@Injectable({ providedIn: 'root' })
export class LabelService {
  private readonly http = inject(HttpClient);
  private readonly cache = signal<Label[]>([]);
  readonly labels = this.cache.asReadonly();

  load(query: LabelQueryParams = {}): Observable<Label[]> {
    return this.http
      .get<ApiEnvelope<Label[]>>(`${environment.apiBaseUrl}/labels`, {
        params: paramsFrom(query),
      })
      .pipe(
        map((response) => response.data),
        tap((items) => this.cache.set(items)),
      );
  }

  summary(query: LabelQueryParams = {}): Observable<LabelSummary> {
    return this.http
      .get<ApiEnvelope<LabelSummary>>(`${environment.apiBaseUrl}/labels/summary`, {
        params: paramsFrom(query),
      })
      .pipe(map((response) => response.data));
  }

  get(id: string): Observable<Label> {
    return this.http
      .get<ApiEnvelope<Label>>(`${environment.apiBaseUrl}/labels/${id}`)
      .pipe(map((response) => response.data));
  }

  create(input: CreateLabelRequest): Observable<Label> {
    return this.request('post', '', input).pipe(tap((item) => this.upsert(item)));
  }
  update(id: string, input: UpdateLabelRequest): Observable<Label> {
    return this.request('patch', `/${id}`, input).pipe(tap((item) => this.upsert(item)));
  }
  setStatus(id: string, isActive: boolean): Observable<Label> {
    return this.request('patch', `/${id}/status`, { isActive }).pipe(
      tap((item) => this.upsert(item)),
    );
  }

  reorder(items: ReorderItem[]): Observable<Label[]> {
    const previous = this.cache();
    const positions = new Map(items.map((item) => [item.id, item.sortOrder]));
    this.cache.set(
      previous
        .map((item) => ({ ...item, sortOrder: positions.get(item.id) ?? item.sortOrder }))
        .sort((a, b) => a.sortOrder - b.sortOrder),
    );
    return this.http
      .patch<ApiEnvelope<Label[]>>(`${environment.apiBaseUrl}/labels/reorder`, { items })
      .pipe(
        map((response) => response.data),
        tap((result) => this.cache.set(result)),
        catchError((error: unknown) => {
          this.cache.set(previous);
          return throwError(() => error);
        }),
      );
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<{ deleted: true }>>(`${environment.apiBaseUrl}/labels/${id}`)
      .pipe(
        map(() => undefined),
        tap(() => this.cache.update((items) => items.filter((item) => item.id !== id))),
      );
  }

  private request(method: 'post' | 'patch', path: string, body: object): Observable<Label> {
    return this.http
      .request<ApiEnvelope<Label>>(method, `${environment.apiBaseUrl}/labels${path}`, { body })
      .pipe(map((response) => response.data));
  }

  private upsert(label: Label): void {
    this.cache.update((items) => {
      const current = items.findIndex((item) => item.id === label.id);
      if (current < 0) return [...items, label];
      return items.map((item) => (item.id === label.id ? label : item));
    });
  }
}

function paramsFrom(query: LabelQueryParams): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params = params.set(key, String(value));
  }
  return params;
}
