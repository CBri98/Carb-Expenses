import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { apiErrorMessage } from '../../core/services/api-error';
import { RecurrenceService } from '../../core/services/recurrence.service';
import { AppBreadcrumbComponent } from '../../shared/components/app-breadcrumb.component';
import {
  EmptyStateComponent,
  LoadingSkeletonComponent,
  PageHeaderComponent,
} from '../../shared/components/catalog-display.components';
import {
  EuroAmountPipe,
  ExpenseStatusBadgeComponent,
  ItalianExpenseDatePipe,
  PaymentMethodBadgeComponent,
} from '../../shared/components/expense-display.components';
import type { ExpenseListItem, PaginationMeta } from '../../shared/models/expense.models';
import type { RecurrenceRule } from '../../shared/models/recurrence.models';
import { recurrenceReminderLabel } from '../../shared/utilities/recurrence-format';
import { PaginationComponent } from '../expenses/components/pagination.component';
import {
  RecurrenceFrequencyPipe,
  RecurrenceStatusBadgeComponent,
} from './recurrence-display.components';

@Component({
  selector: 'app-recurrence-detail',
  standalone: true,
  imports: [
    RouterLink,
    AppBreadcrumbComponent,
    PageHeaderComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    PaginationComponent,
    EuroAmountPipe,
    ItalianExpenseDatePipe,
    ExpenseStatusBadgeComponent,
    PaymentMethodBadgeComponent,
    RecurrenceStatusBadgeComponent,
    RecurrenceFrequencyPipe,
  ],
  templateUrl: './recurrence-detail.component.html',
  styleUrl: './recurrence-detail.component.scss',
})
export class RecurrenceDetailComponent {
  private readonly service = inject(RecurrenceService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly rule = signal<RecurrenceRule | null>(null);
  readonly expenses = signal<ExpenseListItem[]>([]);
  readonly meta = signal<PaginationMeta>({ page: 1, pageSize: 10, totalItems: 0, totalPages: 0 });
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly cancelOpen = signal(false);
  readonly cancelFuture = signal(false);
  readonly activeTab = signal<'general' | 'occurrences' | 'reminders'>('general');
  readonly notice = signal<string | null>(
    this.router.getCurrentNavigation()?.extras.state?.['notice'] ?? null,
  );
  readonly reminderLabel = recurrenceReminderLabel;
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  constructor() {
    this.load();
  }

  page(page: number): void {
    this.loadExpenses(page);
  }

  selectTab(tab: 'general' | 'occurrences' | 'reminders'): void {
    this.activeTab.set(tab);
  }

  pause(): void {
    if (!window.confirm('La ricorrenza verrà sospesa e non genererà nuove spese.')) return;
    this.mutate(this.service.pause(this.id), 'Ricorrenza sospesa.');
  }

  resume(): void {
    if (!window.confirm('La ricorrenza riprenderà dalla prossima data futura, senza arretrati.')) return;
    this.mutate(this.service.resume(this.id), 'Ricorrenza riattivata.');
  }

  openCancel(): void {
    this.cancelFuture.set(false);
    this.cancelOpen.set(true);
  }

  confirmCancel(): void {
    this.mutate(
      this.service.cancel(this.id, this.cancelFuture()),
      'Ricorrenza terminata.',
      () => this.cancelOpen.set(false),
    );
  }

  remove(): void {
    if (!window.confirm('Eliminare questa ricorrenza mai utilizzata?')) return;
    this.busy.set(true);
    this.service.remove(this.id).pipe(
      finalize(() => this.busy.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => void this.router.navigate(['/recurrences']),
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }

  skipNext(): void {
    const date = this.rule()?.nextOccurrenceDate;
    if (!date || !window.confirm(`Saltare definitivamente l’occorrenza del ${date}?`)) return;
    this.mutate(this.service.skip(this.id, date), 'Occorrenza saltata.');
  }

  openExpense(expense: ExpenseListItem): void {
    void this.router.navigate(['/expenses', expense.id]);
  }

  private load(): void {
    this.loading.set(true);
    this.error.set(null);
    forkJoin({
      rule: this.service.get(this.id),
      expenses: this.service.expenses(this.id, { page: 1, pageSize: 10 }),
    }).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ rule, expenses }) => {
        this.rule.set(rule);
        this.expenses.set(expenses.items);
        this.meta.set(expenses.meta);
      },
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }

  private loadExpenses(page: number): void {
    this.service.expenses(this.id, { page, pageSize: 10 }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        this.expenses.set(response.items);
        this.meta.set(response.meta);
      },
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }

  private mutate(
    request: ReturnType<RecurrenceService['pause']>,
    message: string,
    done?: () => void,
  ): void {
    this.busy.set(true);
    request.pipe(
      finalize(() => this.busy.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (rule) => {
        done?.();
        this.rule.set(rule);
        this.notice.set(message);
        this.loadExpenses(1);
      },
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }
}
