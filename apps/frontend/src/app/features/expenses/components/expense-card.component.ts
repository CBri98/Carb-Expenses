import { Component, input, output } from '@angular/core';

import { CategoryBadgeComponent, LabelBadgeComponent } from '../../../shared/components/catalog-display.components';
import {
  EuroAmountPipe,
  ExpenseStatusBadgeComponent,
  ItalianDateTimePipe,
  ItalianExpenseDatePipe,
} from '../../../shared/components/expense-display.components';
import type { ExpenseListItem, ExpenseStatus } from '../../../shared/models/expense.models';
import { RecurrenceExpenseIndicatorComponent } from '../../recurrences/recurrence-display.components';

@Component({
  selector: 'app-expense-card',
  standalone: true,
  imports: [CategoryBadgeComponent, LabelBadgeComponent, ExpenseStatusBadgeComponent, EuroAmountPipe, ItalianExpenseDatePipe, ItalianDateTimePipe, RecurrenceExpenseIndicatorComponent],
  template: `
    <article class="expense-card">
      <div class="d-flex justify-content-between gap-3 align-items-start">
        <div><p class="small text-body-secondary mb-1">{{ expense().expenseDate | italianExpenseDate }}{{ expense().expenseTime ? ' · ' + expense().expenseTime : '' }}</p><h3 class="h6 mb-2">{{ expense().description }}</h3></div>
        <strong class="text-nowrap">{{ expense().amount | euroAmount }}</strong>
      </div>
      <div class="d-flex flex-wrap gap-2 mb-3"><app-category-badge [name]="expense().category.name" [color]="expense().category.color" [icon]="expense().category.icon" /><app-expense-status-badge [status]="expense().status" /></div>
      @if (expense().recurrence; as recurrence) { <div class="mb-3"><app-recurrence-expense-indicator [recurrenceId]="recurrence.id" [recurrenceName]="recurrence.name" /></div> }
      @if (expense().nextReminderAt) { <p class="small text-body-secondary mb-3"><i class="bi bi-bell me-1" aria-hidden="true"></i>Prossimo: {{ expense().nextReminderAt! | italianDateTime }}@if (expense().activeReminderCount > 1) { · {{ expense().activeReminderCount }} attivi }</p> }
      @if (expense().labels.length) { <div class="d-flex flex-wrap gap-1 mb-3">@for (label of expense().labels; track label.id) { <app-label-badge [name]="label.name" [color]="label.color" [icon]="label.icon" /> }</div> }
      <div class="d-flex flex-wrap gap-2">
        <button class="btn btn-sm btn-outline-primary" type="button" (click)="view.emit()"><i class="bi bi-eye me-1" aria-hidden="true"></i>Dettaglio</button>
        <button class="btn btn-sm btn-outline-secondary" type="button" (click)="edit.emit()"><i class="bi bi-pencil me-1" aria-hidden="true"></i>Modifica</button>
        <details class="action-menu"><summary class="btn btn-sm btn-outline-secondary">Altre azioni</summary><div class="action-menu__panel shadow">
          <button type="button" (click)="duplicate.emit()"><i class="bi bi-copy"></i>Duplica</button>
          @if (expense().status !== 'COMPLETED') { <button type="button" (click)="statusChange.emit('COMPLETED')"><i class="bi bi-check-circle"></i>Segna completata</button> }
          @if (expense().status !== 'PLANNED') { <button type="button" (click)="statusChange.emit('PLANNED')"><i class="bi bi-clock"></i>Segna pianificata</button> }
          @if (expense().status !== 'CANCELLED') { <button type="button" (click)="statusChange.emit('CANCELLED')"><i class="bi bi-x-circle"></i>Annulla</button> }
          <button class="text-danger" type="button" (click)="remove.emit()"><i class="bi bi-trash"></i>Elimina</button>
        </div></details>
      </div>
    </article>
  `,
  styles: [`
    .expense-card { padding: 1rem; background: var(--surface); border-bottom: 1px solid var(--border-color); }
    .action-menu { position: relative; }
    summary { list-style: none; cursor: pointer; }
    summary::-webkit-details-marker { display: none; }
    .action-menu__panel { position: absolute; right: 0; z-index: 20; display: grid; min-width: 13rem; padding: .35rem; background: var(--surface); border: 1px solid var(--border-color); border-radius: .6rem; box-shadow: var(--shadow-md); }
    .action-menu__panel button { display: flex; gap: .55rem; padding: .55rem .65rem; color: var(--text-primary); text-align: left; background: transparent; border: 0; border-radius: .35rem; }
    .action-menu__panel button:hover { background: var(--surface-soft); }
  `],
})
export class ExpenseCardComponent {
  readonly expense = input.required<ExpenseListItem>();
  readonly view = output<void>();
  readonly edit = output<void>();
  readonly duplicate = output<void>();
  readonly statusChange = output<ExpenseStatus>();
  readonly remove = output<void>();
}
