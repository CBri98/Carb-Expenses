import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin, map, switchMap } from 'rxjs';

import { apiErrorMessage } from '../../../core/services/api-error';
import { ExpenseService } from '../../../core/services/expense.service';
import { ExpenseReminderService } from '../../../core/services/expense-reminder.service';
import { AppBreadcrumbComponent } from '../../../shared/components/app-breadcrumb.component';
import { LoadingSkeletonComponent, PageHeaderComponent } from '../../../shared/components/catalog-display.components';
import type { ExpenseDetail, ExpenseFormSubmission } from '../../../shared/models/expense.models';
import type { ExpenseReminder } from '../../../shared/models/notification.models';
import { ExpenseFormComponent } from '../components/expense-form.component';

@Component({
  selector: 'app-expense-form-page',
  standalone: true,
  imports: [AppBreadcrumbComponent, PageHeaderComponent, LoadingSkeletonComponent, ExpenseFormComponent],
  template: `
    <section>
      <app-breadcrumb [items]="[{ label: 'Gestione', link: '/expenses' }, { label: 'Spese', link: '/expenses' }, { label: expenseId ? 'Modifica' : 'Nuova' }]" />
      <app-page-header eyebrow="Gestione" [title]="expenseId ? 'Modifica spesa' : 'Nuova spesa'" [subtitle]="expenseId ? 'Aggiorna i dati della spesa selezionata.' : 'Registra una nuova spesa nel gestionale.'" />
      @if (error()) { <div class="alert alert-danger" role="alert">{{ error() }}</div> }
      @if (loading()) { <article class="card"><div class="card-body"><app-loading-skeleton /></div></article> }
      @else {
        <app-expense-form [expense]="expense()" [existingReminders]="reminders()" [submitting]="saving()" [submitLabel]="expenseId ? 'Salva modifiche' : 'Crea spesa'" (submitted)="save($event)" (cancelled)="cancel()" />
      }
    </section>
  `,
})
export class ExpenseFormPageComponent {
  private readonly expenses = inject(ExpenseService);
  private readonly expenseReminders = inject(ExpenseReminderService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly expenseId = this.route.snapshot.paramMap.get('id');
  readonly expense = signal<ExpenseDetail | null>(null);
  readonly reminders = signal<ExpenseReminder[]>([]);
  readonly loading = signal(Boolean(this.expenseId));
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    if (this.expenseId) {
      forkJoin({
        expense: this.expenses.get(this.expenseId),
        reminders: this.expenseReminders.list(this.expenseId),
      }).pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: ({ expense, reminders }) => {
          this.expense.set(expense);
          this.reminders.set(reminders);
        },
        error: (error: unknown) => this.error.set(apiErrorMessage(error)),
      });
    }
  }

  save(submission: ExpenseFormSubmission): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    const request = this.expenseId
      ? this.expenses.update(this.expenseId, submission.expense)
      : this.expenses.create(submission.expense);
    request.pipe(
      switchMap((expense) =>
        this.expenseReminders
          .sync(expense.id, this.reminders(), submission.reminders)
          .pipe(map(() => expense)),
      ),
      finalize(() => this.saving.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (expense) => void this.router.navigate(['/expenses', expense.id], {
        queryParams: this.route.snapshot.queryParams,
      }),
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }

  cancel(): void {
    const target = this.expenseId ? ['/expenses', this.expenseId] : ['/expenses'];
    void this.router.navigate(target, { queryParams: this.route.snapshot.queryParams });
  }
}
