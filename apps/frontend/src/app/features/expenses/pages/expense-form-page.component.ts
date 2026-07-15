import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { apiErrorMessage } from '../../../core/services/api-error';
import { ExpenseService } from '../../../core/services/expense.service';
import { LoadingSkeletonComponent, PageHeaderComponent } from '../../../shared/components/catalog-display.components';
import type { CreateExpenseRequest, ExpenseDetail } from '../../../shared/models/expense.models';
import { ExpenseFormComponent } from '../components/expense-form.component';

@Component({
  selector: 'app-expense-form-page',
  standalone: true,
  imports: [PageHeaderComponent, LoadingSkeletonComponent, ExpenseFormComponent],
  template: `
    <section>
      <nav aria-label="breadcrumb"><ol class="breadcrumb mb-3"><li class="breadcrumb-item">Spese</li><li class="breadcrumb-item active">{{ expenseId ? 'Modifica' : 'Nuova' }}</li></ol></nav>
      <app-page-header [title]="expenseId ? 'Modifica spesa' : 'Nuova spesa'" [subtitle]="expenseId ? 'Aggiorna i dati della spesa selezionata.' : 'Registra una nuova spesa nel gestionale.'" />
      @if (error()) { <div class="alert alert-danger" role="alert">{{ error() }}</div> }
      <article class="card border-0 shadow-sm"><div class="card-body p-3 p-lg-4">
        @if (loading()) { <app-loading-skeleton /> } @else {
          <app-expense-form [expense]="expense()" [submitting]="saving()" [submitLabel]="expenseId ? 'Salva modifiche' : 'Crea spesa'" (submitted)="save($event)" (cancelled)="cancel()" />
        }
      </div></article>
    </section>
  `,
})
export class ExpenseFormPageComponent {
  private readonly expenses = inject(ExpenseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly expenseId = this.route.snapshot.paramMap.get('id');
  readonly expense = signal<ExpenseDetail | null>(null);
  readonly loading = signal(Boolean(this.expenseId));
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    if (this.expenseId) {
      this.expenses.get(this.expenseId).pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: (expense) => this.expense.set(expense),
        error: (error: unknown) => this.error.set(apiErrorMessage(error)),
      });
    }
  }

  save(payload: CreateExpenseRequest): void {
    if (this.saving()) return;
    this.saving.set(true);
    this.error.set(null);
    const request = this.expenseId
      ? this.expenses.update(this.expenseId, payload)
      : this.expenses.create(payload);
    request.pipe(
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
