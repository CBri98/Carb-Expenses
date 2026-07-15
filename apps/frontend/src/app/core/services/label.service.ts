import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiEnvelope } from '../auth/auth.models';
import type {
  CreateLabelRequest,
  Label,
  LabelQueryParams,
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
    return this.http
      .patch<ApiEnvelope<Label[]>>(`${environment.apiBaseUrl}/labels/reorder`, { items })
      .pipe(
        map((response) => response.data),
        tap((result) => this.cache.set(result)),
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
