import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { map, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiEnvelope } from '../auth/auth.models';
import type {
  AppNotification,
  NotificationQueryParams,
  PaginatedNotificationResponse,
  UnreadNotificationCount,
} from '../../shared/models/notification.models';
import type { PaginationMeta } from '../../shared/models/expense.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly unreadState = signal(0);
  private readonly countLoadingState = signal(false);

  readonly unreadCount = this.unreadState.asReadonly();
  readonly countLoading = this.countLoadingState.asReadonly();

  list(query: NotificationQueryParams = {}): Observable<PaginatedNotificationResponse> {
    return this.http
      .get<ApiEnvelope<AppNotification[]>>(`${environment.apiBaseUrl}/notifications`, {
        params: notificationParams(query),
      })
      .pipe(map((response) => ({ items: response.data, meta: paginationMeta(response.meta) })));
  }

  get(id: string): Observable<AppNotification> {
    return this.http
      .get<ApiEnvelope<AppNotification>>(`${environment.apiBaseUrl}/notifications/${id}`)
      .pipe(map((response) => response.data));
  }

  refreshUnreadCount(): Observable<number> {
    this.countLoadingState.set(true);
    return this.http
      .get<ApiEnvelope<UnreadNotificationCount>>(
        `${environment.apiBaseUrl}/notifications/unread-count`,
      )
      .pipe(
        map((response) => response.data.count),
        tap({
          next: (count) => this.unreadState.set(count),
          finalize: () => this.countLoadingState.set(false),
        }),
      );
  }

  markRead(id: string, wasUnread = true): Observable<AppNotification> {
    return this.patch(id, 'read').pipe(
      tap((notification) => {
        if (wasUnread && notification.status === 'READ') {
          this.unreadState.update((value) => Math.max(0, value - 1));
        }
      }),
    );
  }

  markUnread(id: string): Observable<AppNotification> {
    return this.patch(id, 'unread').pipe(
      tap(() => this.unreadState.update((value) => value + 1)),
    );
  }

  markAllRead(): Observable<number> {
    return this.http
      .patch<ApiEnvelope<{ updatedCount: number }>>(
        `${environment.apiBaseUrl}/notifications/read-all`,
        {},
      )
      .pipe(
        map((response) => response.data.updatedCount),
        tap(() => this.unreadState.set(0)),
      );
  }

  archive(id: string, wasUnread: boolean): Observable<AppNotification> {
    return this.patch(id, 'archive').pipe(
      tap(() => {
        if (wasUnread) this.unreadState.update((value) => Math.max(0, value - 1));
      }),
    );
  }

  unarchive(id: string): Observable<AppNotification> {
    return this.patch(id, 'unarchive');
  }

  reset(): void {
    this.unreadState.set(0);
  }

  private patch(id: string, action: 'read' | 'unread' | 'archive' | 'unarchive'): Observable<AppNotification> {
    return this.http
      .patch<ApiEnvelope<AppNotification>>(
        `${environment.apiBaseUrl}/notifications/${id}/${action}`,
        {},
      )
      .pipe(map((response) => response.data));
  }
}

function notificationParams(query: NotificationQueryParams): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '') continue;
    params = params.set(key, String(value));
  }
  return params;
}

function paginationMeta(meta: Record<string, unknown>): PaginationMeta {
  return {
    page: numberMeta(meta['page'], 1),
    pageSize: numberMeta(meta['pageSize'], 20),
    totalItems: numberMeta(meta['totalItems'], 0),
    totalPages: numberMeta(meta['totalPages'], 0),
  };
}

function numberMeta(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
