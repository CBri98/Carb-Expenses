import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EuroAmountPipe, ItalianExpenseDatePipe } from '../../shared/components/expense-display.components';
import type { UpcomingExpense } from '../../shared/models/dashboard.models';
import { dueLabel } from '../../shared/utilities/dashboard-format';

@Component({
  selector: 'app-upcoming-expenses',
  standalone: true,
  imports: [RouterLink, EuroAmountPipe, ItalianExpenseDatePipe],
  template: `
    @if (expenses().length === 0) {
      <div class="empty-list"><i class="bi bi-calendar2-check" aria-hidden="true"></i><p>Non ci sono spese future pianificate.</p></div>
    } @else {
      <ul class="list-group list-group-flush">
        @for (expense of expenses(); track expense.id) {
          <li class="list-group-item px-0 py-3">
            <div class="d-flex gap-3 justify-content-between">
              <div class="min-w-0">
                <span class="due">{{ due(expense) }}</span>
                <a class="d-block fw-semibold text-truncate mt-1" [routerLink]="['/expenses', expense.id]">{{ expense.description }}</a>
                <small class="text-body-secondary">{{ expense.expenseDate | italianExpenseDate }} · {{ expense.category.name }}</small>
              </div>
              <div class="text-end">
                <strong class="d-block text-nowrap">{{ expense.amount | euroAmount }}</strong>
                <button class="btn btn-sm btn-outline-primary mt-2" type="button" (click)="complete.emit(expense)">Segna completata</button>
              </div>
            </div>
          </li>
        }
      </ul>
    }
  `,
  styles: [`.empty-list{display:grid;min-height:11rem;color:var(--text-secondary);text-align:center;place-content:center}.empty-list i{font-size:1.7rem}.empty-list p{margin:.5rem 0}.due{color:#655c13;font-size:.75rem;font-weight:750;text-transform:uppercase}.min-w-0{min-width:0}`],
})
export class UpcomingExpensesComponent {
  readonly expenses = input.required<readonly UpcomingExpense[]>();
  readonly complete = output<UpcomingExpense>();
  due(expense: UpcomingExpense): string { return dueLabel(expense.daysUntilDue, expense.expenseDate); }
}
