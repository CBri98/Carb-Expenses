import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { QuickExpenseModalComponent } from '../../features/expenses/components/quick-expense-modal.component';
import type { ExpenseDetail } from '../../shared/models/expense.models';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, QuickExpenseModalComponent],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly user = this.authService.user;
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);
  readonly loggingOut = signal(false);
  readonly quickExpenseOpen = signal(false);
  readonly toast = signal<string | null>(null);

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  logout(): void {
    this.loggingOut.set(true);
    this.authService
      .logout()
      .pipe(
        finalize(() => this.loggingOut.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => void this.router.navigate(['/auth/login']));
  }

  expenseCreated(expense: ExpenseDetail): void {
    this.toast.set(`Spesa “${expense.description}” creata correttamente.`);
    setTimeout(() => this.toast.set(null), 4000);
  }
}
