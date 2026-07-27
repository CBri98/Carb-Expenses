import { Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgLabelTemplateDirective, NgOptionTemplateDirective, NgSelectComponent } from '@ng-select/ng-select';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { FilterPanelComponent } from '../../shared/components/filter-panel.component';
import {
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPES,
  type NotificationFilters,
} from '../../shared/models/notification.models';

type NotificationAdvancedFilters = Omit<NotificationFilters, 'search'>;

@Component({
  selector: 'app-notification-filters',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgSelectComponent,
    NgOptionTemplateDirective,
    NgLabelTemplateDirective,
    FilterPanelComponent,
  ],
  template: `
    <app-filter-panel
      title="Filtri notifiche"
      titleId="notification-filters-title"
      panelId="notification-filters-panel"
      [expanded]="expanded()"
      [activeCount]="activeCount()"
      [summary]="summary()"
      (expandedChange)="expanded.set($event)"
      (resetRequested)="reset()"
    >
      <form [formGroup]="form">
        <div class="row g-3 align-items-end">
          <div class="col-12 col-sm-6 col-lg-3">
            <label class="form-label" for="notification-status">Stato</label>
            <ng-select labelForId="notification-status" [items]="statuses" bindLabel="label" bindValue="value" [clearable]="false" formControlName="status" ariaLabel="Filtra notifiche per stato">
              <ng-template ng-option-tmp let-item="item"><span class="select-option"><i class="bi" [class]="item.icon" aria-hidden="true"></i>{{ item.label }}</span></ng-template>
              <ng-template ng-label-tmp let-item="item"><span class="select-option"><i class="bi" [class]="item.icon" aria-hidden="true"></i>{{ item.label }}</span></ng-template>
            </ng-select>
          </div>
          <div class="col-12 col-sm-6 col-lg-3">
            <label class="form-label" for="notification-type">Tipo</label>
            <ng-select labelForId="notification-type" [items]="types" bindLabel="label" bindValue="value" placeholder="Tutti i tipi" formControlName="type" ariaLabel="Filtra notifiche per tipo">
              <ng-template ng-option-tmp let-item="item"><span class="select-option"><i class="bi" [class]="item.icon" aria-hidden="true"></i>{{ item.label }}</span></ng-template>
              <ng-template ng-label-tmp let-item="item"><span class="select-option"><i class="bi" [class]="item.icon" aria-hidden="true"></i>{{ item.label }}</span></ng-template>
            </ng-select>
          </div>
          <div class="col-6 col-lg-2"><label class="form-label" for="notification-from">Dal</label><input id="notification-from" class="form-control" type="date" formControlName="dateFrom"></div>
          <div class="col-6 col-lg-2"><label class="form-label" for="notification-to">Al</label><input id="notification-to" class="form-control" type="date" formControlName="dateTo"></div>
          <div class="col-12 col-lg-2 d-flex justify-content-lg-end">
            <button class="btn btn-outline-secondary" type="button" [disabled]="activeCount() === 0" (click)="reset()"><i class="bi bi-arrow-counterclockwise me-2" aria-hidden="true"></i>Azzera</button>
          </div>
        </div>
      </form>
    </app-filter-panel>
  `,
})
export class NotificationFiltersComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly filters = input.required<NotificationFilters>();
  readonly filtersApplied = output<NotificationFilters>();
  readonly filtersReset = output<void>();
  readonly types = NOTIFICATION_TYPES;
  readonly statuses = NOTIFICATION_STATUSES;
  readonly expanded = signal(true);
  readonly activeCount = computed(() => {
    const filters = this.filters();
    return Number(Boolean(filters.status)) + Number(Boolean(filters.type))
      + Number(Boolean(filters.expenseId)) + Number(Boolean(filters.dateFrom))
      + Number(Boolean(filters.dateTo));
  });
  readonly summary = computed(() => this.activeCount()
    ? `${this.activeCount()} filtri avanzati applicati`
    : 'Nessun filtro avanzato applicato');
  readonly form = this.formBuilder.nonNullable.group<NotificationAdvancedFilters>({
    status: '', type: '', expenseId: '', dateFrom: '', dateTo: '',
  });

  constructor() {
    effect(() => {
      const { status, type, expenseId, dateFrom, dateTo } = this.filters();
      this.form.reset({ status, type, expenseId, dateFrom, dateTo }, { emitEvent: false });
    });
    this.form.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.filtersApplied.emit({
      search: this.filters().search,
      ...this.form.getRawValue(),
    }));
  }

  reset(): void {
    this.form.reset({ status: '', type: '', expenseId: '', dateFrom: '', dateTo: '' }, { emitEvent: false });
    this.filtersReset.emit();
  }
}
