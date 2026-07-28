import { Component, input, Pipe, type PipeTransform } from '@angular/core';

import {
  REMINDER_SOURCES,
  REMINDER_STATUSES,
  REMINDER_TYPES,
  type ReminderSource,
  type ReminderStatus,
} from '../../shared/models/reminder-management.models';
import type { ReminderType } from '../../shared/models/notification.models';

@Pipe({ name: 'reminderTypeLabel', standalone: true })
export class ReminderTypeLabelPipe implements PipeTransform {
  transform(value: ReminderType): string {
    return REMINDER_TYPES.find((item) => item.value === value)?.label ?? value;
  }
}

@Component({
  selector: 'app-reminder-type-badge',
  standalone: true,
  template: `<span class="badge rounded-pill reminder-type"><i class="bi me-1" [class]="icon()" aria-hidden="true"></i>{{ label() }}</span>`,
  styles: [`.reminder-type { color: var(--primary-strong); background: var(--primary-soft); border: 1px solid color-mix(in srgb, var(--primary) 28%, transparent); font-weight: 700; }`],
})
export class ReminderTypeBadgeComponent {
  readonly type = input.required<ReminderType>();

  label(): string {
    return REMINDER_TYPES.find((item) => item.value === this.type())?.label ?? this.type();
  }

  icon(): string {
    return REMINDER_TYPES.find((item) => item.value === this.type())?.icon ?? 'bi-alarm';
  }
}

@Component({
  selector: 'app-reminder-status-badge',
  standalone: true,
  template: `<span class="badge rounded-pill" [class]="tone()"><i class="bi me-1" [class]="icon()" aria-hidden="true"></i>{{ label() }}</span>`,
})
export class ReminderStatusBadgeComponent {
  readonly status = input.required<ReminderStatus>();

  label(): string {
    return REMINDER_STATUSES.find((item) => item.value === this.status())?.label ?? this.status();
  }

  icon(): string {
    return REMINDER_STATUSES.find((item) => item.value === this.status())?.icon ?? 'bi-alarm';
  }

  tone(): string {
    const tones: Record<ReminderStatus, string> = {
      ACTIVE: 'text-bg-primary',
      UPCOMING: 'text-bg-info',
      DUE: 'text-bg-warning',
      PROCESSED: 'text-bg-success',
      CANCELLED: 'text-bg-secondary',
      INVALID: 'text-bg-danger',
    };
    return tones[this.status()];
  }
}

@Component({
  selector: 'app-reminder-source',
  standalone: true,
  template: `<span class="badge rounded-pill reminder-source"><i class="bi me-1" [class]="icon()" aria-hidden="true"></i>{{ label() }}</span>`,
  styles: [`.reminder-source { color: var(--text-secondary); background: var(--surface-soft); border: 1px solid var(--border-color); font-weight: 650; white-space: nowrap; }`],
})
export class ReminderSourceComponent {
  readonly source = input.required<ReminderSource>();

  label(): string {
    return REMINDER_SOURCES.find((item) => item.value === this.source())?.label ?? this.source();
  }

  icon(): string {
    return REMINDER_SOURCES.find((item) => item.value === this.source())?.icon ?? 'bi-alarm';
  }
}
