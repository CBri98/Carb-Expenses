import { Component, input, Pipe, PipeTransform } from '@angular/core';
import { RouterLink } from '@angular/router';

import type {
  RecurrenceFrequency,
  RecurrenceStatus,
} from '../../shared/models/recurrence.models';
import {
  recurrenceFrequencyLabel,
  recurrenceStatusLabel,
} from '../../shared/utilities/recurrence-format';

@Pipe({ name: 'recurrenceFrequency', standalone: true })
export class RecurrenceFrequencyPipe implements PipeTransform {
  transform(frequency: RecurrenceFrequency, interval: number): string {
    return recurrenceFrequencyLabel(frequency, interval);
  }
}

@Component({
  selector: 'app-recurrence-status-badge',
  standalone: true,
  template: `<span class="badge" [class.text-bg-success]="status() === 'ACTIVE'" [class.text-bg-warning]="status() === 'PAUSED'" [class.text-bg-secondary]="status() === 'COMPLETED'" [class.text-bg-danger]="status() === 'CANCELLED'"><i class="bi me-1" [class.bi-play-circle]="status() === 'ACTIVE'" [class.bi-pause-circle]="status() === 'PAUSED'" [class.bi-check-circle]="status() === 'COMPLETED'" [class.bi-x-circle]="status() === 'CANCELLED'" aria-hidden="true"></i>{{ label() }}</span>`,
})
export class RecurrenceStatusBadgeComponent {
  readonly status = input.required<RecurrenceStatus>();
  label(): string {
    return recurrenceStatusLabel(this.status());
  }
}

@Component({
  selector: 'app-recurrence-expense-indicator',
  standalone: true,
  imports: [RouterLink],
  template: `
    @if (recurrenceId()) {
      <a
        class="badge rounded-pill text-bg-primary text-decoration-none"
        [routerLink]="['/recurrences', recurrenceId()]"
        [attr.aria-label]="'Apri ricorrenza ' + recurrenceName()"
        (click)="$event.stopPropagation()"
        (keydown)="$event.stopPropagation()"
      >
        <i class="bi bi-arrow-repeat me-1" aria-hidden="true"></i>Spesa ricorrente
      </a>
    }
  `,
})
export class RecurrenceExpenseIndicatorComponent {
  readonly recurrenceId = input<string | null>(null);
  readonly recurrenceName = input('');
}
