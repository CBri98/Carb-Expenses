import { Component, input, output } from '@angular/core';

import type { AppNotification } from '../../shared/models/notification.models';
import { NotificationListItemComponent } from './notification-list-item.component';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [NotificationListItemComponent],
  template: `
    <div class="notification-list">
      @for (notification of notifications(); track notification.id) {
        <app-notification-list-item
          [notification]="notification"
          [busy]="busy()"
          (opened)="opened.emit($event)"
          (read)="read.emit($event)"
          (unread)="unread.emit($event)"
          (archived)="archived.emit($event)"
          (unarchived)="unarchived.emit($event)"
        />
      }
    </div>
  `,
  styles: [`.notification-list { overflow: hidden; border: 1px solid var(--border-color); border-radius: .8rem; }`],
})
export class NotificationListComponent {
  readonly notifications = input.required<readonly AppNotification[]>();
  readonly busy = input(false);
  readonly opened = output<AppNotification>();
  readonly read = output<AppNotification>();
  readonly unread = output<AppNotification>();
  readonly archived = output<AppNotification>();
  readonly unarchived = output<AppNotification>();
}
