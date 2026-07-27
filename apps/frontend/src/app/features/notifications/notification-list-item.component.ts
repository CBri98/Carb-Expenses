import { Component, input, output } from '@angular/core';

import { ItalianDateTimePipe } from '../../shared/components/expense-display.components';
import type { AppNotification } from '../../shared/models/notification.models';
import { notificationRelativeTime } from '../../shared/utilities/notification-date';
import {
  NotificationStatusBadgeComponent,
  NotificationTypeIconComponent,
} from './notification-display.components';

@Component({
  selector: 'app-notification-list-item',
  standalone: true,
  imports: [ItalianDateTimePipe, NotificationStatusBadgeComponent, NotificationTypeIconComponent],
  template: `
    <article class="notification-item" [class.notification-item--unread]="notification().status === 'UNREAD'">
      <app-notification-type-icon [type]="notification().type" />
      <div class="notification-item__body">
        <div class="d-flex flex-wrap gap-2 align-items-center mb-1">
          <strong>{{ notification().title }}</strong>
          <app-notification-status-badge [status]="notification().status" />
        </div>
        <p class="mb-2">{{ notification().message }}</p>
        @if (notification().expense; as expense) {
          <button class="expense-link" type="button" (click)="opened.emit(notification())">
            <i class="bi" [class]="expense.category.icon" [style.color]="expense.category.color" aria-hidden="true"></i>
            {{ expense.description }}
          </button>
        } @else {
          <span class="small text-body-secondary">La spesa collegata non è più disponibile.</span>
        }
        <div class="small text-body-secondary mt-2">
          <time [attr.datetime]="notification().createdAt" [attr.aria-label]="notification().createdAt | italianDateTime">
            {{ relative(notification().createdAt) }} · {{ notification().createdAt | italianDateTime }}
          </time>
        </div>
      </div>
      <div class="notification-item__actions">
        @if (notification().status === 'UNREAD') {
          <button class="btn btn-sm btn-outline-secondary" type="button" [disabled]="busy()" (click)="read.emit(notification())">Segna letta</button>
        } @else if (notification().status === 'READ') {
          <button class="btn btn-sm btn-outline-secondary" type="button" [disabled]="busy()" (click)="unread.emit(notification())">Segna non letta</button>
        }
        @if (notification().status !== 'ARCHIVED') {
          <button class="btn btn-sm btn-outline-danger" type="button" [disabled]="busy()" (click)="archived.emit(notification())" aria-label="Archivia notifica">
            <i class="bi bi-archive" aria-hidden="true"></i>
          </button>
        } @else {
          <button class="btn btn-sm btn-outline-primary" type="button" [disabled]="busy()" (click)="unarchived.emit(notification())">
            <i class="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>Disarchivia
          </button>
        }
      </div>
    </article>
  `,
  styles: [`
    .notification-item { display: flex; gap: .9rem; align-items: flex-start; padding: 1rem; color: var(--text-primary); background: var(--surface); border-bottom: 1px solid var(--border-color); }
    .notification-item--unread { background: var(--primary-soft); box-shadow: inset .22rem 0 var(--primary); }
    .notification-item__body { min-width: 0; flex: 1; }
    .notification-item__body p { overflow-wrap: anywhere; }
    .notification-item__actions { display: flex; gap: .45rem; align-items: center; }
    .expense-link { display: inline-flex; gap: .4rem; align-items: center; padding: 0; color: var(--primary-strong); background: none; border: 0; font-weight: 650; text-align: left; }
    @media (max-width: 767.98px) { .notification-item { flex-wrap: wrap; } .notification-item__actions { width: 100%; padding-left: 3.2rem; } }
  `],
})
export class NotificationListItemComponent {
  readonly notification = input.required<AppNotification>();
  readonly busy = input(false);
  readonly opened = output<AppNotification>();
  readonly read = output<AppNotification>();
  readonly unread = output<AppNotification>();
  readonly archived = output<AppNotification>();
  readonly unarchived = output<AppNotification>();
  readonly relative = notificationRelativeTime;
}
