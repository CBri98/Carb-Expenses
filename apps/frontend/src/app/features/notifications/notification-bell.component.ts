import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { catchError, filter, finalize, fromEvent, merge, of, switchMap, timer } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import type { AppNotification } from '../../shared/models/notification.models';
import { UnreadNotificationBadgeComponent } from './notification-display.components';
import { NotificationDropdownComponent } from './notification-dropdown.component';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [UnreadNotificationBadgeComponent, NotificationDropdownComponent],
  template: `
    <div class="notification-bell">
      <button
        class="btn btn-outline-secondary notification-bell__button"
        type="button"
        [attr.aria-label]="ariaLabel()"
        [attr.aria-expanded]="open()"
        aria-haspopup="dialog"
        (click)="toggle()"
      >
        <i class="bi bi-bell" aria-hidden="true"></i>
        <app-unread-notification-badge [count]="notifications.unreadCount()" />
      </button>
      @if (open()) {
        <app-notification-dropdown
          [notifications]="recent()"
          [loading]="loading()"
          [hasUnread]="notifications.unreadCount() > 0"
          (opened)="openNotification($event)"
          (readAll)="markAllRead()"
          (closed)="open.set(false)"
        />
      }
    </div>
  `,
  styles: [`
    .notification-bell { position: relative; }
    .notification-bell__button { position: relative; width: 2.7rem; height: 2.7rem; padding: 0; }
  `],
})
export class NotificationBellComponent {
  readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly open = signal(false);
  readonly loading = signal(false);
  readonly recent = signal<AppNotification[]>([]);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return;
    merge(
      timer(0, environment.notificationPollIntervalMs),
      fromEvent(window, 'focus'),
    )
      .pipe(
        filter(() => this.auth.authenticated()),
        switchMap(() => this.notifications.refreshUnreadCount().pipe(catchError(() => of(0)))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    fromEvent<PointerEvent>(document, 'pointerdown').pipe(
      filter(() => this.open()),
      filter((event) => !event.composedPath().includes(this.host.nativeElement)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.open.set(false));

    fromEvent<KeyboardEvent>(document, 'keydown').pipe(
      filter(() => this.open()),
      filter((event) => event.key === 'Escape'),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.open.set(false));

    this.router.events.pipe(
      filter((event) => event instanceof NavigationStart),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.open.set(false));
  }

  ariaLabel(): string {
    const count = this.notifications.unreadCount();
    return count === 0 ? 'Notifiche, nessuna non letta' : `Notifiche, ${count} non lette`;
  }

  toggle(): void {
    this.open.update((value) => !value);
    if (this.open()) this.loadRecent();
  }

  openNotification(notification: AppNotification): void {
    const navigate = (): void => {
      this.open.set(false);
      if (notification.expense) {
        void this.router.navigate(['/expenses', notification.expense.id]);
      } else {
        this.toast.show('La spesa collegata non è più disponibile.', 'info');
      }
    };
    if (notification.status !== 'UNREAD') {
      navigate();
      return;
    }
    this.notifications
      .markRead(notification.id, true)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: navigate, error: () => this.toast.show('Non è stato possibile aggiornare la notifica.', 'danger') });
  }

  markAllRead(): void {
    this.notifications
      .markAllRead()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.recent.update((items) => items.map((item) => item.status === 'UNREAD' ? { ...item, status: 'READ', readAt: new Date().toISOString() } : item));
          this.toast.show('Tutte le notifiche sono state segnate come lette.');
        },
        error: () => this.toast.show('Non è stato possibile aggiornare le notifiche.', 'danger'),
      });
  }

  private loadRecent(): void {
    this.loading.set(true);
    this.notifications
      .list({ page: 1, pageSize: 5 })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (result) => this.recent.set(result.items),
        error: () => this.toast.show('Non è stato possibile caricare le notifiche.', 'danger'),
      });
  }
}
