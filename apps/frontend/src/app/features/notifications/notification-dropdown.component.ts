import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LoadingSkeletonComponent } from '../../shared/components/catalog-display.components';
import { ItalianDateTimePipe } from '../../shared/components/expense-display.components';
import type { AppNotification } from '../../shared/models/notification.models';
import { notificationRelativeTime } from '../../shared/utilities/notification-date';
import { NotificationTypeIconComponent } from './notification-display.components';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [ItalianDateTimePipe, RouterLink, LoadingSkeletonComponent, NotificationTypeIconComponent],
  template: `
    <section class="notification-dropdown" role="dialog" aria-label="Notifiche recenti">
      <header>
        <div><strong>Notifiche</strong><small>Le più recenti</small></div>
        <button class="btn btn-sm btn-link" type="button" [disabled]="loading() || !hasUnread()" (click)="readAll.emit()">Segna tutte come lette</button>
      </header>
      <div class="notification-dropdown__list">
        @if (loading()) {
          <div class="p-3"><app-loading-skeleton /></div>
        } @else {
          @for (notification of notifications(); track notification.id) {
            <button
              class="dropdown-notification"
              [class.dropdown-notification--unread]="notification.status === 'UNREAD'"
              type="button"
              (click)="opened.emit(notification)"
            >
              <app-notification-type-icon [type]="notification.type" />
              <span><strong>{{ notification.title }}</strong><small>{{ notification.message }}</small><time [attr.datetime]="notification.createdAt" [title]="notification.createdAt | italianDateTime">{{ relative(notification.createdAt) }}</time></span>
              @if (notification.status === 'UNREAD') { <span class="visually-hidden">Non letta</span> }
            </button>
          } @empty {
            <div class="p-4 text-center text-body-secondary"><i class="bi bi-bell-slash d-block fs-4 mb-2"></i>Non hai ancora ricevuto notifiche.</div>
          }
        }
      </div>
      <footer><a routerLink="/notifications" (click)="closed.emit()">Vai a tutte le notifiche <i class="bi bi-arrow-right"></i></a></footer>
    </section>
  `,
  styles: [`
    .notification-dropdown { position: absolute; top: calc(100% + .65rem); right: 0; z-index: 1060; width: min(26rem, calc(100vw - 2rem)); overflow: hidden; color: var(--text-primary); background: var(--surface); border: 1px solid var(--border-color); border-radius: .85rem; box-shadow: var(--shadow-md); }
    header, footer { display: flex; align-items: center; justify-content: space-between; gap: .75rem; padding: .85rem 1rem; background: var(--surface-soft); }
    header div { display: grid; } header small { color: var(--text-secondary); }
    footer { justify-content: center; } footer a { font-weight: 700; text-decoration: none; }
    .notification-dropdown__list { max-height: 23rem; overflow-y: auto; }
    .dropdown-notification { display: flex; width: 100%; gap: .75rem; padding: .85rem 1rem; color: var(--text-primary); background: var(--surface); border: 0; border-bottom: 1px solid var(--border-color); text-align: left; }
    .dropdown-notification--unread { background: var(--primary-soft); }
    .dropdown-notification > span { display: grid; min-width: 0; gap: .15rem; }
    .dropdown-notification small { display: -webkit-box; overflow: hidden; color: var(--text-secondary); -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
    .dropdown-notification time { color: var(--text-secondary); font-size: .72rem; }
    @media (max-width: 575.98px) { .notification-dropdown { position: fixed; inset: 4.5rem .5rem auto; width: auto; } }
  `],
})
export class NotificationDropdownComponent {
  readonly notifications = input.required<readonly AppNotification[]>();
  readonly loading = input(false);
  readonly hasUnread = input(false);
  readonly opened = output<AppNotification>();
  readonly readAll = output<void>();
  readonly closed = output<void>();
  readonly relative = notificationRelativeTime;
}
