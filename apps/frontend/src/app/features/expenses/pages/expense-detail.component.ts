import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { apiErrorMessage } from '../../../core/services/api-error';
import { ExpenseService } from '../../../core/services/expense.service';
import { CategoryBadgeComponent, LabelBadgeComponent, LoadingSkeletonComponent, PageHeaderComponent } from '../../../shared/components/catalog-display.components';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { EuroAmountPipe, ExpenseStatusBadgeComponent, ItalianExpenseDatePipe, PaymentMethodBadgeComponent } from '../../../shared/components/expense-display.components';
import type { ExpenseDetail, ExpenseStatus } from '../../../shared/models/expense.models';

@Component({
  selector: 'app-expense-detail',
  standalone: true,
  imports: [
    DatePipe, PageHeaderComponent, LoadingSkeletonComponent, ConfirmDialogComponent,
    CategoryBadgeComponent, LabelBadgeComponent, ExpenseStatusBadgeComponent,
    PaymentMethodBadgeComponent, EuroAmountPipe, ItalianExpenseDatePipe,
  ],
  templateUrl: './expense-detail.component.html',
  styleUrl: './expense-detail.component.scss',
})
export class ExpenseDetailComponent {
  private readonly expenses = inject(ExpenseService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly expense = signal<ExpenseDetail | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly deleteOpen = signal(false);

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
      next: (expense) => this.expense.set(expense),
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

  private load(): void {
    this.expenses.get(this.id).pipe(
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (expense) => this.expense.set(expense),
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }
}
