import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';
import { finalize } from 'rxjs';

import { apiErrorMessage } from '../../core/services/api-error';
import { SettingsStore } from '../../core/services/settings.store';
import { EXPENSE_STATUSES, PAYMENT_METHODS, type PaymentMethod } from '../../shared/models/expense.models';
import type { CalendarViewPreference } from '../../shared/models/settings.models';

@Component({
  selector: 'app-experience-settings',
  standalone: true,
  imports: [ReactiveFormsModule, NgSelectComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()">
      @if (notice(); as message) { <div class="alert" [class.alert-success]="message.tone === 'success'" [class.alert-danger]="message.tone === 'danger'" role="status">{{ message.text }}</div> }
      <article class="card settings-card"><div class="settings-card__header"><h2 class="h5 mb-1">Navigazione e tabelle</h2></div><div class="settings-card__body">
        <div class="row g-3">
          <div class="col-12"><div class="form-check form-switch"><input id="sidebar-default" class="form-check-input" type="checkbox" formControlName="sidebarCollapsedByDefault" /><label class="form-check-label" for="sidebar-default">Sidebar compatta di default</label></div></div>
          <div class="col-12"><div class="form-check form-switch"><input id="compact-tables" class="form-check-input" type="checkbox" formControlName="compactTables" /><label class="form-check-label" for="compact-tables">Tabelle compatte</label></div></div>
          <div class="col-12 col-md-6"><label class="form-label" for="default-page-size">Righe per pagina</label><ng-select labelForId="default-page-size" [items]="pageSizes" [clearable]="false" [searchable]="false" ariaLabel="Righe predefinite per pagina" formControlName="defaultPageSize" /></div>
          <div class="col-12"><div class="form-check form-switch"><input id="remember-filters" class="form-check-input" type="checkbox" formControlName="rememberExpenseFilters" /><label class="form-check-label" for="remember-filters">Ricorda gli ultimi filtri della pagina Spese</label></div></div>
        </div>
      </div></article>
      <article class="card settings-card"><div class="settings-card__header"><h2 class="h5 mb-1">Nuova spesa</h2><p class="small text-body-secondary mb-0">I valori espliciti da calendario, duplicazione o route hanno sempre precedenza.</p></div><div class="settings-card__body"><div class="row g-3">
        <div class="col-12 col-md-6"><label class="form-label" for="default-expense-status">Stato predefinito</label><ng-select labelForId="default-expense-status" [items]="expenseStatuses" bindLabel="label" bindValue="value" [clearable]="false" [searchable]="false" ariaLabel="Stato predefinito della spesa" formControlName="defaultExpenseStatus"><ng-template ng-option-tmp let-item="item"><span class="select-option"><i class="bi" [class]="item.icon" aria-hidden="true"></i>{{ item.label }}</span></ng-template><ng-template ng-label-tmp let-item="item"><span class="select-option"><i class="bi" [class]="item.icon" aria-hidden="true"></i>{{ item.label }}</span></ng-template></ng-select></div>
        <div class="col-12 col-md-6"><label class="form-label" for="default-payment">Metodo di pagamento</label><ng-select labelForId="default-payment" [items]="paymentMethods" bindLabel="label" bindValue="value" placeholder="Nessuna preferenza" ariaLabel="Metodo di pagamento predefinito" formControlName="defaultPaymentMethod"><ng-template ng-option-tmp let-item="item"><span class="select-option"><i class="bi" [class]="item.icon" aria-hidden="true"></i>{{ item.label }}</span></ng-template><ng-template ng-label-tmp let-item="item"><span class="select-option"><i class="bi" [class]="item.icon" aria-hidden="true"></i>{{ item.label }}</span></ng-template></ng-select></div>
      </div></div></article>
      <article class="card settings-card"><div class="settings-card__header"><h2 class="h5 mb-1">Dashboard e calendario</h2></div><div class="settings-card__body"><div class="row g-3">
        <div class="col-12 col-md-6"><label class="form-label" for="trend-months">Andamento predefinito</label><ng-select labelForId="trend-months" [items]="trendOptions" bindLabel="label" bindValue="value" [clearable]="false" [searchable]="false" ariaLabel="Periodo andamento predefinito" formControlName="dashboardTrendMonths" /></div>
        <div class="col-12 col-md-6"><label class="form-label" for="calendar-view">Vista calendario</label><ng-select labelForId="calendar-view" [items]="calendarViews" bindLabel="label" bindValue="value" [clearable]="false" [searchable]="false" ariaLabel="Vista calendario predefinita" formControlName="defaultCalendarView"><ng-template ng-option-tmp let-item="item"><span class="select-option"><i class="bi" [class]="item.icon" aria-hidden="true"></i>{{ item.label }}</span></ng-template><ng-template ng-label-tmp let-item="item"><span class="select-option"><i class="bi" [class]="item.icon" aria-hidden="true"></i>{{ item.label }}</span></ng-template></ng-select></div>
      </div><div class="settings-actions mt-3"><button class="btn btn-primary" type="submit" [disabled]="saving() || !form.dirty">@if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> } @else { <i class="bi bi-check-lg me-2" aria-hidden="true"></i> }Salva esperienza</button></div></div></article>
    </form>
  `,
  styleUrl: './settings.scss',
})
export class ExperienceSettingsComponent {
  private readonly store = inject(SettingsStore);
  private readonly builder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly saving = signal(false);
  readonly notice = signal<{ tone: 'success' | 'danger'; text: string } | null>(null);
  readonly pageSizes = [10, 20, 50, 100] as const;
  readonly expenseStatuses = EXPENSE_STATUSES.filter((status) => status.value !== 'CANCELLED');
  readonly paymentMethods = PAYMENT_METHODS;
  readonly trendOptions = [{ value: 6, label: '6 mesi' }, { value: 12, label: '12 mesi' }] as const;
  readonly calendarViews: ReadonlyArray<{ value: CalendarViewPreference; label: string; icon: string }> = [
    { value: 'MONTH', label: 'Mese', icon: 'bi-calendar-month' }, { value: 'WEEK', label: 'Settimana', icon: 'bi-calendar-week' }, { value: 'LIST', label: 'Elenco', icon: 'bi-list-ul' },
  ];
  readonly form = this.builder.nonNullable.group({
    sidebarCollapsedByDefault: false, compactTables: false, defaultPageSize: 20,
    rememberExpenseFilters: true, defaultExpenseStatus: 'COMPLETED' as 'COMPLETED' | 'PLANNED',
    defaultPaymentMethod: '' as PaymentMethod | '', defaultCalendarView: 'MONTH' as CalendarViewPreference,
    dashboardTrendMonths: 12 as 6 | 12,
  });

  constructor() {
    this.store.ensureLoaded();
    effect(() => {
      const value = this.store.experience();
      this.form.reset({ ...value, defaultPaymentMethod: value.defaultPaymentMethod ?? '' });
    });
  }

  save(): void {
    const value = this.form.getRawValue(); this.saving.set(true);
    this.store.updateExperience({ ...value, defaultPaymentMethod: value.defaultPaymentMethod || null }).pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.form.markAsPristine(); this.notice.set({ tone: 'success', text: 'Preferenze di esperienza aggiornate.' }); },
      error: (error: unknown) => this.notice.set({ tone: 'danger', text: apiErrorMessage(error) }),
    });
  }
}
