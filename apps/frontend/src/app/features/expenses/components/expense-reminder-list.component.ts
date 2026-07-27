import { Component, input, output } from '@angular/core';

import { ItalianDateTimePipe } from '../../../shared/components/expense-display.components';
import type { ExpenseReminder } from '../../../shared/models/notification.models';

@Component({
  selector: 'app-expense-reminder-list',
  standalone: true,
  imports: [ItalianDateTimePipe],
  template: `
    <div class="reminder-list">
      @for (reminder of reminders(); track reminder.id) {
        <article class="reminder-row">
          <i class="bi bi-alarm" aria-hidden="true"></i>
          <div class="flex-grow-1">
            <div class="d-flex flex-wrap align-items-center gap-2">
              <strong>{{ label(reminder.type) }}</strong>
              <span class="badge" [class.text-bg-success]="reminder.isActive" [class.text-bg-secondary]="!reminder.isActive">
                {{ reminder.isActive ? 'Attivo' : 'Disattivato' }}
              </span>
              <span class="badge text-bg-light border">{{ reminder.processedAt ? 'Processato' : 'Da processare' }}</span>
            </div>
            <time class="small text-body-secondary" [attr.datetime]="reminder.scheduledAt">
              {{ reminder.scheduledAt | italianDateTime }}
            </time>
          </div>
          @if (reminder.isActive && !reminder.processedAt) {
            <button class="btn btn-sm btn-outline-danger" type="button" [disabled]="busy()" (click)="removed.emit(reminder)" aria-label="Rimuovi promemoria">
              <i class="bi bi-trash" aria-hidden="true"></i>
            </button>
          }
        </article>
      } @empty {
        <p class="text-body-secondary mb-0">Nessun promemoria configurato.</p>
      }
    </div>
  `,
  styles: [`
    .reminder-list { display: grid; gap: .65rem; }
    .reminder-row { display: flex; gap: .8rem; align-items: center; padding: .8rem; border: 1px solid var(--border-color); border-radius: .7rem; }
    .reminder-row > i { color: var(--primary-strong); font-size: 1.15rem; }
  `],
})
export class ExpenseReminderListComponent {
  readonly reminders = input.required<readonly ExpenseReminder[]>();
  readonly busy = input(false);
  readonly removed = output<ExpenseReminder>();

  label(type: ExpenseReminder['type']): string {
    return {
      SAME_DAY: 'Il giorno stesso',
      ONE_DAY_BEFORE: '1 giorno prima',
      THREE_DAYS_BEFORE: '3 giorni prima',
      SEVEN_DAYS_BEFORE: '7 giorni prima',
      CUSTOM: 'Personalizzato',
    }[type];
  }
}
