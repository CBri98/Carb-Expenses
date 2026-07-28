import { Routes } from '@angular/router';

import { authGuard } from './core/auth/guards/auth.guard';
import { guestGuard } from './core/auth/guards/guest.guard';

export const routes: Routes = [
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/auth-layout/auth-layout.component').then(
        (module) => module.AuthLayoutComponent,
    ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'login' },
      {
        path: 'login',
        title: 'Accedi | Carbexpenses',
        loadComponent: () =>
          import('./features/auth/login/login.component').then((module) => module.LoginComponent),
      },
      {
        path: 'register',
        title: 'Registrati | Carbexpenses',
        loadComponent: () =>
          import('./features/auth/register/register.component').then(
            (module) => module.RegisterComponent,
          ),
      },
    ],
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/app-layout.component').then((module) => module.AppLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard | Carbexpenses',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (module) => module.DashboardComponent,
          ),
      },
      {
        path: 'expenses',
        title: 'Spese | Carbexpenses',
        loadComponent: () =>
          import('./features/expenses/pages/expenses-page.component').then(
            (module) => module.ExpensesPageComponent,
          ),
      },
      {
        path: 'notifications',
        title: 'Notifiche | Carbexpenses',
        loadComponent: () =>
          import('./features/notifications/notifications-page.component').then(
            (module) => module.NotificationsPageComponent,
          ),
      },
      {
        path: 'reminders',
        title: 'Promemoria | Carbexpenses',
        loadComponent: () =>
          import('./features/reminders/reminders-page.component').then(
            (module) => module.RemindersPageComponent,
          ),
      },
      {
        path: 'recurrences',
        title: 'Spese ricorrenti | Carbexpenses',
        loadComponent: () =>
          import('./features/recurrences/recurrences-page.component').then(
            (module) => module.RecurrencesPageComponent,
          ),
      },
      {
        path: 'recurrences/new',
        title: 'Nuova ricorrenza | Carbexpenses',
        loadComponent: () =>
          import('./features/recurrences/recurrence-form-page.component').then(
            (module) => module.RecurrenceFormPageComponent,
          ),
      },
      {
        path: 'recurrences/:id/edit',
        title: 'Modifica ricorrenza | Carbexpenses',
        loadComponent: () =>
          import('./features/recurrences/recurrence-form-page.component').then(
            (module) => module.RecurrenceFormPageComponent,
          ),
      },
      {
        path: 'recurrences/:id',
        title: 'Dettaglio ricorrenza | Carbexpenses',
        loadComponent: () =>
          import('./features/recurrences/recurrence-detail.component').then(
            (module) => module.RecurrenceDetailComponent,
          ),
      },
      {
        path: 'calendar',
        title: 'Calendario | Carbexpenses',
        loadComponent: () =>
          import('./features/calendar/calendar-page.component').then(
            (module) => module.CalendarPageComponent,
          ),
      },
      {
        path: 'expenses/new',
        title: 'Nuova spesa | Carbexpenses',
        loadComponent: () =>
          import('./features/expenses/pages/expense-form-page.component').then(
            (module) => module.ExpenseFormPageComponent,
          ),
      },
      {
        path: 'expenses/:id/edit',
        title: 'Modifica spesa | Carbexpenses',
        loadComponent: () =>
          import('./features/expenses/pages/expense-form-page.component').then(
            (module) => module.ExpenseFormPageComponent,
          ),
      },
      {
        path: 'expenses/:id',
        title: 'Dettaglio spesa | Carbexpenses',
        loadComponent: () =>
          import('./features/expenses/pages/expense-detail.component').then(
            (module) => module.ExpenseDetailComponent,
          ),
      },
      {
        path: 'reports/monthly',
        title: 'Report mensile | Carbexpenses',
        loadComponent: () =>
          import('./features/reports/monthly-report-page.component').then(
            (module) => module.MonthlyReportPageComponent,
          ),
      },
      {
        path: 'reports/compare',
        title: 'Confronto mensile | Carbexpenses',
        loadComponent: () =>
          import('./features/reports/month-comparison-page.component').then(
            (module) => module.MonthComparisonPageComponent,
          ),
      },
      {
        path: 'settings/categories',
        title: 'Categorie | Carbexpenses',
        loadComponent: () =>
          import('./features/catalog/categories/categories.component').then(
            (module) => module.CategoriesComponent,
          ),
      },
      {
        path: 'settings/labels',
        title: 'Etichette | Carbexpenses',
        loadComponent: () =>
          import('./features/catalog/labels/labels.component').then(
            (module) => module.LabelsComponent,
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/settings/settings-page.component').then(
            (module) => module.SettingsPageComponent,
          ),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'account' },
          {
            path: 'account',
            title: 'Account | Carbexpenses',
            loadComponent: () =>
              import('./features/settings/account-settings.component').then(
                (module) => module.AccountSettingsComponent,
              ),
          },
          {
            path: 'appearance',
            title: 'Aspetto | Carbexpenses',
            loadComponent: () =>
              import('./features/settings/appearance-settings.component').then(
                (module) => module.AppearanceSettingsComponent,
              ),
          },
          {
            path: 'experience',
            title: 'Esperienza | Carbexpenses',
            loadComponent: () =>
              import('./features/settings/experience-settings.component').then(
                (module) => module.ExperienceSettingsComponent,
              ),
          },
          {
            path: 'icons',
            title: 'Icone | Carbexpenses',
            loadComponent: () =>
              import('./features/settings/icon-settings.component').then(
                (module) => module.IconSettingsComponent,
              ),
          },
          {
            path: 'notifications',
            title: 'Promemoria | Carbexpenses',
            loadComponent: () =>
              import('./features/settings/reminder-settings.component').then(
                (module) => module.ReminderSettingsComponent,
              ),
          },
        ],
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
