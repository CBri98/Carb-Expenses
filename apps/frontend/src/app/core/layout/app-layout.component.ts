import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../services/notification.service';
import { ToastService } from '../services/toast.service';
import { SettingsStore } from '../services/settings.store';
import { QuickExpenseModalComponent } from '../../features/expenses/components/quick-expense-modal.component';
import { NotificationBellComponent } from '../../features/notifications/notification-bell.component';
import type { ExpenseDetail } from '../../shared/models/expense.models';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    QuickExpenseModalComponent,
    NotificationBellComponent,
  ],
  templateUrl: './app-layout.component.html',
  styleUrl: './app-layout.component.scss',
})
export class AppLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  readonly toastService = inject(ToastService);
  readonly notifications = inject(NotificationService);
  readonly settings = inject(SettingsStore);

  readonly user = this.authService.user;
  readonly collapsed = signal(this.settings.experience().sidebarCollapsedByDefault);
  readonly mobileOpen = signal(false);
  readonly loggingOut = signal(false);
  readonly quickExpenseOpen = signal(false);
  readonly toast = this.toastService.message;
  private sidebarInteracted = false;

  constructor() {
    this.settings.ensureLoaded();
    effect(() => {
      if (this.settings.loaded() && !this.sidebarInteracted) {
        this.collapsed.set(this.settings.experience().sidebarCollapsedByDefault);
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarInteracted = true;
    this.collapsed.update((value) => !value);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  isSettingsActive(): boolean {
    const path = this.router.url.split(/[?#]/, 1)[0];
    return path === '/settings' || (
      path.startsWith('/settings/')
      && !path.startsWith('/settings/categories')
      && !path.startsWith('/settings/labels')
    );
  }

  logout(): void {
    this.loggingOut.set(true);
    this.authService
      .logout()
      .pipe(
        finalize(() => this.loggingOut.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.notifications.reset();
        this.settings.clearSession();
        void this.router.navigate(['/auth/login']);
      });
  }

  expenseCreated(expense: ExpenseDetail): void {
    this.toastService.show(`Spesa “${expense.description}” creata correttamente.`);
  }
}
