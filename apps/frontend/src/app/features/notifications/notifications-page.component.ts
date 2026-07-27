import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, map, Subject } from 'rxjs';

import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { SettingsStore } from '../../core/services/settings.store';
import { AppBreadcrumbComponent } from '../../shared/components/app-breadcrumb.component';
import {
  CounterCardComponent,
  EmptyStateComponent,
  LoadingSkeletonComponent,
  PageHeaderComponent,
} from '../../shared/components/catalog-display.components';
import type { PaginationMeta } from '../../shared/models/expense.models';
import type {
  AppNotification,
  NotificationFilters,
  NotificationQueryParams,
  NotificationStatus,
  NotificationType,
} from '../../shared/models/notification.models';
import { PaginationComponent } from '../expenses/components/pagination.component';
import { NotificationFiltersComponent } from './notification-filters.component';
import { NotificationListComponent } from './notification-list.component';

const EMPTY_META: PaginationMeta = { page: 1, pageSize: 20, totalItems: 0, totalPages: 0 };

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    AppBreadcrumbComponent,
    PageHeaderComponent,
    CounterCardComponent,
    LoadingSkeletonComponent,
    EmptyStateComponent,
    PaginationComponent,
    NotificationFiltersComponent,
    NotificationListComponent,
  ],
  template: `
    <section>
      <app-breadcrumb [items]="[{ label: 'Area personale', link: '/notifications' }, { label: 'Notifiche' }]" />
      <app-page-header title="Notifiche" subtitle="Promemoria e aggiornamenti sulle tue spese">
        <button class="btn btn-primary" type="button" [disabled]="busy() || notifications.unreadCount() === 0" (click)="markAllRead()"><i class="bi bi-check2-all me-2"></i>Segna tutte come lette</button>
      </app-page-header>

      <div class="row g-3 mb-3">
        <div class="col-6 col-lg-3"><app-counter-card label="Risultati" [value]="meta().totalItems" icon="bi-bell" /></div>
        <div class="col-6 col-lg-3"><app-counter-card label="Non lette" [value]="notifications.unreadCount()" icon="bi-envelope-exclamation" /></div>
      </div>

      <div class="card border-0 shadow-sm mb-3"><div class="card-body notification-search">
        <label class="form-label" for="notification-search">Cerca nelle notifiche</label>
        <div class="input-group">
          <span class="input-group-text"><i class="bi bi-search" aria-hidden="true"></i></span>
          <input id="notification-search" class="form-control" type="search" maxlength="150" placeholder="Titolo o messaggio…" [ngModel]="searchDraft()" (ngModelChange)="updateSearch($event)">
          @if (searchDraft()) { <button class="btn btn-outline-secondary" type="button" aria-label="Cancella ricerca" (click)="updateSearch('')"><i class="bi bi-x-lg" aria-hidden="true"></i></button> }
        </div>
      </div></div>

      <app-notification-filters [filters]="filters()" (filtersApplied)="applyFilters($event)" (filtersReset)="resetFilters()" />
      @if (error()) { <div class="alert alert-danger d-flex justify-content-between align-items-center" role="alert"><span>{{ error() }}</span><button class="btn btn-sm btn-outline-danger" type="button" (click)="load()">Riprova</button></div> }
      @if (loading()) {
        <div class="card border-0 shadow-sm"><div class="card-body"><app-loading-skeleton /></div></div>
      } @else if (items().length > 0) {
        <app-notification-list [notifications]="items()" [busy]="busy()" (opened)="openNotification($event)" (read)="markRead($event)" (unread)="markUnread($event)" (archived)="archive($event)" (unarchived)="unarchive($event)" />
        <app-pagination [meta]="meta()" (pageChange)="changePage($event)" />
      } @else {
        <app-empty-state [title]="emptyTitle()" message="Puoi modificare i filtri oppure consultare le spese pianificate.">
          <button class="btn btn-outline-secondary" type="button" (click)="resetFilters()">Azzera filtri</button>
          <a class="btn btn-primary" routerLink="/calendar">Vai al calendario</a>
        </app-empty-state>
      }
    </section>
  `,
  styles: [`.notification-search { display: grid; grid-template-columns: minmax(10rem, 34rem); }`],
})
export class NotificationsPageComponent {
  readonly notifications = inject(NotificationService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly settings = inject(SettingsStore);
  private readonly searchChanges = new Subject<string>();

  readonly items = signal<AppNotification[]>([]);
  readonly meta = signal<PaginationMeta>(EMPTY_META);
  readonly filters = signal<NotificationFilters>(emptyFilters());
  readonly query = signal<NotificationQueryParams>({ page: 1, pageSize: 20 });
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchDraft = signal('');

  constructor() {
    this.settings.ensureLoaded();
    this.searchChanges.pipe(
      map((value) => value.trim().replace(/\s+/g, ' ').slice(0, 150)),
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((search) => {
      if (search !== (this.query().search ?? '')) {
        this.applyFilters({ ...this.filters(), search });
      }
    });
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const query = queryFromParams(params, this.settings.experience().defaultPageSize);
        this.query.set(query);
        this.filters.set(filtersFromQuery(query));
        this.searchDraft.set(query.search ?? '');
        this.load();
      });
    this.notifications.refreshUnreadCount().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ error: () => undefined });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.notifications.list(this.query()).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (result) => { this.items.set(result.items); this.meta.set(result.meta); },
      error: () => this.error.set('Non è stato possibile caricare le notifiche.'),
    });
  }

  applyFilters(filters: NotificationFilters): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: cleanQuery({ ...filters, page: 1 }) });
  }

  updateSearch(value: string): void {
    this.searchDraft.set(value);
    this.searchChanges.next(value);
  }

  resetFilters(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  changePage(page: number): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { ...cleanQuery(this.query()), page } });
  }

  markRead(notification: AppNotification): void {
    this.runAction(
      this.notifications.markRead(notification.id, notification.status === 'UNREAD'),
      'Notifica segnata come letta.',
    );
  }

  markUnread(notification: AppNotification): void {
    this.runAction(this.notifications.markUnread(notification.id), 'Notifica segnata come non letta.');
  }

  archive(notification: AppNotification): void {
    this.runAction(
      this.notifications.archive(notification.id, notification.status === 'UNREAD'),
      'Notifica archiviata.',
      true,
    );
  }

  unarchive(notification: AppNotification): void {
    this.runAction(
      this.notifications.unarchive(notification.id),
      'Notifica disarchiviata e segnata come letta.',
      true,
    );
  }

  markAllRead(): void {
    this.busy.set(true);
    this.notifications.markAllRead().pipe(
      finalize(() => this.busy.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => { this.toast.show('Tutte le notifiche sono state segnate come lette.'); this.load(); },
      error: () => this.toast.show('Non è stato possibile aggiornare le notifiche.', 'danger'),
    });
  }

  openNotification(notification: AppNotification): void {
    const navigate = (): void => {
      if (notification.expense) void this.router.navigate(['/expenses', notification.expense.id]);
      else this.toast.show('La spesa collegata non è più disponibile.', 'info');
    };
    if (notification.status !== 'UNREAD') { navigate(); return; }
    this.notifications.markRead(notification.id, true).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({ next: navigate, error: navigate });
  }

  emptyTitle(): string {
    if (this.filters().status === 'UNREAD') return 'Hai letto tutte le notifiche.';
    return Object.values(this.filters()).some(Boolean)
      ? 'Nessuna notifica corrisponde ai filtri applicati.'
      : 'Non hai ancora ricevuto notifiche.';
  }

  private runAction(
    request: ReturnType<NotificationService['markRead']>,
    message: string,
    reload = false,
  ): void {
    this.busy.set(true);
    request.pipe(
      finalize(() => this.busy.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (updated) => {
        this.toast.show(message);
        if (reload) this.load();
        else this.items.update((items) => items.map((item) => item.id === updated.id ? updated : item));
      },
      error: () => this.toast.show('Non è stato possibile aggiornare la notifica.', 'danger'),
    });
  }
}

function queryFromParams(params: ParamMap, defaultPageSize = 20): NotificationQueryParams {
  const page = positiveInteger(params.get('page'), 1);
  const status = params.get('status');
  const type = params.get('type');
  return cleanQuery({
    page,
    pageSize: positiveInteger(params.get('pageSize'), defaultPageSize),
    search: params.get('search')?.trim().slice(0, 150) || undefined,
    status: isStatus(status) ? status : undefined,
    type: isType(type) ? type : undefined,
    expenseId: params.get('expenseId') || undefined,
    dateFrom: params.get('dateFrom') || undefined,
    dateTo: params.get('dateTo') || undefined,
  });
}

function filtersFromQuery(query: NotificationQueryParams): NotificationFilters {
  return {
    search: query.search ?? '', status: query.status ?? '', type: query.type ?? '', expenseId: query.expenseId ?? '',
    dateFrom: query.dateFrom ?? '', dateTo: query.dateTo ?? '',
  };
}

function emptyFilters(): NotificationFilters {
  return { search: '', status: '', type: '', expenseId: '', dateFrom: '', dateTo: '' };
}

function cleanQuery<T extends object>(query: T): T {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== '' && value !== undefined)) as T;
}

function positiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function isStatus(value: string | null): value is NotificationStatus {
  return value === 'UNREAD' || value === 'READ' || value === 'ARCHIVED';
}

function isType(value: string | null): value is NotificationType {
  return value === 'EXPENSE_REMINDER' || value === 'EXPENSE_DUE_TODAY' || value === 'EXPENSE_OVERDUE';
}
