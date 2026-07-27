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
        class="recurrence-expense-link"
        [routerLink]="['/recurrences', recurrenceId()]"
        [attr.aria-label]="'Spesa ricorrente. Apri ricorrenza ' + recurrenceName()"
        [attr.title]="recurrenceName()"
        (click)="$event.stopPropagation()"
        (keydown)="$event.stopPropagation()"
      >
        <i class="bi bi-arrow-repeat me-1" aria-hidden="true"></i>Spesa ricorrente
      </a>
    }
  `,
  styles: [`
    .recurrence-expense-link {
      display: inline-flex;
      gap: .2rem;
      align-items: center;
      color: var(--primary-strong);
      font-size: .78rem;
      font-weight: 700;
      line-height: 1.3;
      text-decoration: none;
    }
    .recurrence-expense-link:hover { text-decoration: underline; }
    .recurrence-expense-link:focus-visible { border-radius: .2rem; outline: var(--focus-ring); outline-offset: 2px; }
  `],
})
export class RecurrenceExpenseIndicatorComponent {
  readonly recurrenceId = input<string | null>(null);
  readonly recurrenceName = input('');
}
