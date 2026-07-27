import { Component, computed, input } from '@angular/core';

import type {
  NotificationStatus,
  NotificationType,
} from '../../shared/models/notification.models';

@Component({
  selector: 'app-unread-notification-badge',
  standalone: true,
  template: `
    @if (count() > 0) {
      <span class="notification-count" aria-hidden="true">{{ display() }}</span>
      <span class="visually-hidden">{{ count() }} notifiche non lette</span>
    }
  `,
  styles: [`
    .notification-count { position: absolute; top: -.3rem; right: -.35rem; display: grid; min-width: 1.25rem; height: 1.25rem; place-items: center; padding: 0 .25rem; color: #fff; background: #b42318; border: 2px solid var(--topbar-bg); border-radius: 999px; font-size: .65rem; font-weight: 800; }
  `],
})
export class UnreadNotificationBadgeComponent {
  readonly count = input.required<number>();
  readonly display = computed(() => (this.count() > 9 ? '9+' : String(this.count())));
}

@Component({
  selector: 'app-notification-type-icon',
  standalone: true,
  template: `<span class="type-icon" [class.type-icon--danger]="type() === 'EXPENSE_OVERDUE'"><i class="bi" [class]="icon()" aria-hidden="true"></i></span>`,
  styles: [`
    .type-icon { display: grid; width: 2.35rem; height: 2.35rem; flex: 0 0 auto; place-items: center; color: var(--primary-strong); background: var(--primary-soft); border-radius: .65rem; }
    .type-icon--danger { color: var(--bs-danger); background: var(--danger-soft); }
  `],
})
export class NotificationTypeIconComponent {
  readonly type = input.required<NotificationType>();
  readonly icon = computed(() => ({
    EXPENSE_REMINDER: 'bi-alarm',
    EXPENSE_DUE_TODAY: 'bi-calendar-check',
    EXPENSE_OVERDUE: 'bi-exclamation-triangle',
  })[this.type()]);
}

@Component({
  selector: 'app-notification-status-badge',
  standalone: true,
  template: `<span class="badge" [class]="classes()">{{ label() }}</span>`,
})
export class NotificationStatusBadgeComponent {
  readonly status = input.required<NotificationStatus>();
  readonly label = computed(() => ({ UNREAD: 'Non letta', READ: 'Letta', ARCHIVED: 'Archiviata' })[this.status()]);
  readonly classes = computed(() => ({
    UNREAD: 'text-bg-primary',
    READ: 'text-bg-light border',
    ARCHIVED: 'text-bg-secondary',
  })[this.status()]);
}
