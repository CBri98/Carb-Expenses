import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { apiErrorMessage } from '../../../core/services/api-error';
import { ExpenseService } from '../../../core/services/expense.service';
import { ExpenseReminderService } from '../../../core/services/expense-reminder.service';
import { ToastService } from '../../../core/services/toast.service';
import { CategoryBadgeComponent, LabelBadgeComponent, LoadingSkeletonComponent, PageHeaderComponent } from '../../../shared/components/catalog-display.components';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { EuroAmountPipe, ExpenseStatusBadgeComponent, ItalianDateTimePipe, ItalianExtendedDatePipe, PaymentMethodBadgeComponent } from '../../../shared/components/expense-display.components';
import type { ExpenseDetail, ExpenseStatus } from '../../../shared/models/expense.models';
import type { ExpenseReminder, ReminderDraft } from '../../../shared/models/notification.models';
import { RecurrenceExpenseIndicatorComponent } from '../../recurrences/recurrence-display.components';
import { ExpenseReminderFormComponent } from '../components/expense-reminder-form.component';
import { ExpenseReminderListComponent } from '../components/expense-reminder-list.component';

@Component({
  selector: 'app-expense-detail',
  standalone: true,
  imports: [
    PageHeaderComponent, LoadingSkeletonComponent, ConfirmDialogComponent,
    CategoryBadgeComponent, LabelBadgeComponent, ExpenseStatusBadgeComponent,
    PaymentMethodBadgeComponent, EuroAmountPipe, ItalianExtendedDatePipe, ItalianDateTimePipe,
    ExpenseReminderFormComponent, ExpenseReminderListComponent,
    RecurrenceExpenseIndicatorComponent,
  ],
  templateUrl: './expense-detail.component.html',
  styleUrl: './expense-detail.component.scss',
})
export class ExpenseDetailComponent {
  private readonly expenses = inject(ExpenseService);
  private readonly expenseReminders = inject(ExpenseReminderService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly expense = signal<ExpenseDetail | null>(null);
  readonly reminders = signal<ExpenseReminder[]>([]);
  readonly reminderDrafts = signal<ReminderDraft[]>([]);
  readonly remindersValid = signal(true);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly deleteOpen = signal(false);
  readonly activeTab = signal<'general' | 'reminders'>('general');

  constructor() { this.load(); }

  back(): void {
    const queryParams = { ...this.route.snapshot.queryParams };
    const returnTo = queryParams['returnTo'];
    delete queryParams['returnTo'];
    const target = returnTo === 'calendar' ? ['/calendar'] : ['/expenses'];
    void this.router.navigate(target, { queryParams });
  }

  edit(): void {
    void this.router.navigate(['/expenses', this.id, 'edit'], { queryParams: this.route.snapshot.queryParams });
  }

  duplicate(): void {
    this.busy.set(true);
    this.expenses.duplicate(this.id).pipe(
      finalize(() => this.busy.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (expense) => void this.router.navigate(['/expenses', expense.id], { queryParams: this.route.snapshot.queryParams }),
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }

  setStatus(status: ExpenseStatus): void {
    this.busy.set(true);
    this.expenses.setStatus(this.id, status).pipe(
      finalize(() => this.busy.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (expense) => {
        this.expense.set(expense);
        this.reloadReminders();
      },
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }

  remove(): void {
    this.busy.set(true);
    this.expenses.remove(this.id).pipe(
      finalize(() => this.busy.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => this.back(),
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }

  saveReminders(): void {
    if (this.busy() || !this.remindersValid()) return;
    this.busy.set(true);
    this.expenseReminders.sync(this.id, this.reminders(), this.reminderDrafts()).pipe(
      finalize(() => this.busy.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => { this.toast.show('Promemoria aggiornati.'); this.reloadReminders(); },
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }

  removeReminder(reminder: ExpenseReminder): void {
    this.busy.set(true);
    this.expenseReminders.remove(this.id, reminder.id).pipe(
      finalize(() => this.busy.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => { this.toast.show('Promemoria rimosso.'); this.reloadReminders(); },
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }

  private load(): void {
    forkJoin({
      expense: this.expenses.get(this.id),
      reminders: this.expenseReminders.list(this.id),
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

  private reloadReminders(): void {
    this.expenseReminders.list(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (reminders) => this.reminders.set(reminders),
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }
}
