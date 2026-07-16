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
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
