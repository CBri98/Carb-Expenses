import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import type { ApiEnvelope } from '../auth/auth.models';
import type {
  Category,
  CategoryQueryParams,
  CreateCategoryRequest,
  ReorderItem,
  UpdateCategoryRequest,
} from '../../shared/models/catalog.models';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly cache = signal<Category[]>([]);
  readonly categories = this.cache.asReadonly();

  load(query: CategoryQueryParams = {}): Observable<Category[]> {
    return this.http
      .get<ApiEnvelope<Category[]>>(`${environment.apiBaseUrl}/categories`, {
        params: paramsFrom(query),
      })
      .pipe(
        map((response) => response.data),
        tap((items) => this.cache.set(items)),
      );
  }

  create(input: CreateCategoryRequest): Observable<Category> {
    return this.request('post', '', input).pipe(tap((item) => this.upsert(item)));
  }

  update(id: string, input: UpdateCategoryRequest): Observable<Category> {
    return this.request('patch', `/${id}`, input).pipe(tap((item) => this.upsert(item)));
  }

  setStatus(id: string, isActive: boolean): Observable<Category> {
    return this.request('patch', `/${id}/status`, { isActive }).pipe(
      tap((item) => this.upsert(item)),
    );
  }

  reorder(items: ReorderItem[]): Observable<Category[]> {
    return this.http
      .patch<ApiEnvelope<Category[]>>(`${environment.apiBaseUrl}/categories/reorder`, { items })
      .pipe(
        map((response) => response.data),
        tap((result) => this.cache.set(result)),
      );
  }

  remove(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<{ deleted: true }>>(`${environment.apiBaseUrl}/categories/${id}`)
      .pipe(
        map(() => undefined),
        tap(() => this.cache.update((items) => items.filter((item) => item.id !== id))),
      );
  }

  private request(method: 'post' | 'patch', path: string, body: object): Observable<Category> {
    return this.http
      .request<ApiEnvelope<Category>>(method, `${environment.apiBaseUrl}/categories${path}`, {
        body,
      })
      .pipe(map((response) => response.data));
  }

  private upsert(category: Category): void {
    this.cache.update((items) => {
      const current = items.findIndex((item) => item.id === category.id);
      if (current < 0) return [...items, category];
      return items.map((item) => (item.id === category.id ? category : item));
    });
  }
}

function paramsFrom(query: CategoryQueryParams): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') params = params.set(key, String(value));
  }
  return params;
}
