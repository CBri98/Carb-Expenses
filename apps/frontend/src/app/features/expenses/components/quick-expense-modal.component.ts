import { Component, DestroyRef, inject, input, output, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, map, switchMap } from 'rxjs';

import { apiErrorMessage } from '../../../core/services/api-error';
import { ExpenseService } from '../../../core/services/expense.service';
import { ExpenseReminderService } from '../../../core/services/expense-reminder.service';
import type { ExpenseDetail, ExpenseFormSubmission } from '../../../shared/models/expense.models';
import { EscapeCloseDirective } from '../../../shared/directives/escape-close.directive';
import { ExpenseFormComponent } from './expense-form.component';

@Component({
  selector: 'app-quick-expense-modal',
  standalone: true,
  imports: [ExpenseFormComponent, EscapeCloseDirective],
  template: `
    @if (open()) {
      <div class="modal d-block" tabindex="-1" role="dialog" aria-modal="true" aria-labelledby="quick-expense-title" [appEscapeClose]="!saving()" (escapeClose)="closed.emit()">
        <div class="modal-dialog modal-dialog-centered modal-lg"><div class="modal-content shadow-lg">
          <div class="modal-header"><div><p class="text-primary text-uppercase small fw-bold mb-1">Inserimento rapido</p><h2 class="modal-title fs-5" id="quick-expense-title">Nuova spesa</h2></div><button class="btn-close" type="button" aria-label="Chiudi" [disabled]="saving()" (click)="closed.emit()"></button></div>
          <div class="modal-body">
            @if (error()) { <div class="alert alert-danger" role="alert">{{ error() }}</div> }
            <app-expense-form
              [compact]="true"
              [initialDate]="initialDate()"
              [initialTime]="initialTime()"
              [submitting]="saving()"
              submitLabel="Registra spesa"
              (submitted)="save($event)"
              (cancelled)="closed.emit()"
            />
          </div>
        </div></div>
      </div><div class="modal-backdrop show"></div>
    }
  `,
  styles: [`
    .modal { z-index: 1060; overflow-y: auto; }
    .modal-backdrop { z-index: 1055; }
    @media (max-width: 767.98px) { .modal-dialog { min-height: calc(100% - 1rem); margin: .5rem; } }
  `],
})
export class QuickExpenseModalComponent {
  private readonly expenses = inject(ExpenseService);
  private readonly expenseReminders = inject(ExpenseReminderService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly form = viewChild(ExpenseFormComponent);

  readonly open = input(false);
  readonly initialDate = input<string | null>(null);
  readonly initialTime = input<string | null>(null);
  readonly closed = output<void>();
  readonly created = output<ExpenseDetail>();
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  save(submission: ExpenseFormSubmission): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    this.expenses
      .create(submission.expense)
      .pipe(
        switchMap((expense) =>
          this.expenseReminders
            .sync(expense.id, [], submission.reminders)
            .pipe(map(() => expense)),
        ),
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (expense) => {
          this.form()?.resetForCreate();
          this.created.emit(expense);
          this.closed.emit();
        },
        error: (error: unknown) => this.error.set(apiErrorMessage(error)),
      });
  }
}
