import { Component, input, output } from '@angular/core';

import { CategoryBadgeComponent, LabelBadgeComponent } from '../../../shared/components/catalog-display.components';
import {
  EuroAmountPipe,
  ExpenseStatusBadgeComponent,
  ItalianExpenseDatePipe,
  PaymentMethodBadgeComponent,
} from '../../../shared/components/expense-display.components';
import type { ExpenseListItem, ExpenseQueryParams, ExpenseStatus } from '../../../shared/models/expense.models';
import { ExpenseActionsMenuComponent } from './expense-actions-menu.component';
import { ExpenseCardComponent } from './expense-card.component';

export interface ExpenseStatusAction {
  expense: ExpenseListItem;
  status: ExpenseStatus;
}

@Component({
  selector: 'app-expense-table',
  standalone: true,
  imports: [
    CategoryBadgeComponent,
    LabelBadgeComponent,
    ExpenseStatusBadgeComponent,
    PaymentMethodBadgeComponent,
    EuroAmountPipe,
    ItalianExpenseDatePipe,
    ExpenseActionsMenuComponent,
    ExpenseCardComponent,
  ],
  templateUrl: './expense-table.component.html',
  styleUrl: './expense-table.component.scss',
})
export class ExpenseTableComponent {
  readonly expenses = input.required<readonly ExpenseListItem[]>();
  readonly sortBy = input<ExpenseQueryParams['sortBy']>('expenseDate');
  readonly sortDirection = input<ExpenseQueryParams['sortDirection']>('desc');
  readonly view = output<ExpenseListItem>();
  readonly edit = output<ExpenseListItem>();
  readonly duplicate = output<ExpenseListItem>();
  readonly statusChange = output<ExpenseStatusAction>();
  readonly remove = output<ExpenseListItem>();
  readonly sort = output<ExpenseQueryParams['sortBy']>();

  activateRow(expense: ExpenseListItem, event?: Event): void {
    event?.preventDefault();
    this.view.emit(expense);
  }

  changeStatus(expense: ExpenseListItem, status: ExpenseStatus): void {
    this.statusChange.emit({ expense, status });
  }
}
