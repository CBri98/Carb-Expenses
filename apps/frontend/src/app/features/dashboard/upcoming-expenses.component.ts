import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { EuroAmountPipe, ItalianExpenseDatePipe } from '../../shared/components/expense-display.components';
import type { UpcomingExpense } from '../../shared/models/dashboard.models';
import { dueLabel } from '../../shared/utilities/dashboard-format';
import { RecurrenceExpenseIndicatorComponent } from '../recurrences/recurrence-display.components';

@Component({
  selector: 'app-upcoming-expenses',
  standalone: true,
  imports: [RouterLink, EuroAmountPipe, ItalianExpenseDatePipe, RecurrenceExpenseIndicatorComponent],
  template: `
    @if (expenses().length === 0) {
      <div class="empty-list"><i class="bi bi-calendar2-check" aria-hidden="true"></i><p>Non ci sono spese future pianificate.</p></div>
    } @else {
      @for (group of groups(); track group.key) {
      <section class="upcoming-group" [attr.aria-labelledby]="'upcoming-group-' + group.key">
        <h3 class="upcoming-group__title" [id]="'upcoming-group-' + group.key">{{ group.label }}</h3>
        <ul class="list-group list-group-flush">
        @for (expense of group.expenses; track expense.id) {
          <li class="list-group-item px-0 py-3">
            <div class="d-flex gap-3 justify-content-between">
              <div class="min-w-0">
                <span class="due">{{ due(expense) }}</span>
                <a class="d-block fw-semibold text-truncate mt-1" [routerLink]="['/expenses', expense.id]">{{ expense.description }}</a>
                @if (expense.recurrence; as recurrence) { <div class="mt-1"><app-recurrence-expense-indicator [recurrenceId]="recurrence.id" [recurrenceName]="recurrence.name" /></div> }
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
      </section>
      }
    }
  `,
  styles: [`.empty-list{display:grid;min-height:11rem;color:var(--text-secondary);text-align:center;place-content:center}.empty-list i{font-size:1.7rem}.empty-list p{margin:.5rem 0}.due{color:var(--bs-warning-text-emphasis,var(--bs-warning));font-size:.75rem;font-weight:750;text-transform:uppercase}.min-w-0{min-width:0}.upcoming-group__title{margin:1rem 0 .2rem;color:var(--text-secondary);font-size:.75rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase}.upcoming-group:first-child .upcoming-group__title{margin-top:0}`],
})
export class UpcomingExpensesComponent {
  readonly expenses = input.required<readonly UpcomingExpense[]>();
  readonly complete = output<UpcomingExpense>();
  readonly groups = computed(() => groupUpcoming(this.expenses()));
  due(expense: UpcomingExpense): string { return dueLabel(expense.daysUntilDue, expense.expenseDate); }
}

function groupUpcoming(expenses: readonly UpcomingExpense[]): Array<{
  key: string;
  label: string;
  expenses: UpcomingExpense[];
}> {
  const groups = new Map<string, UpcomingExpense[]>();
  for (const expense of expenses) {
    const key = expense.daysUntilDue < 0 ? 'overdue' : expense.expenseDate.slice(0, 7);
    groups.set(key, [...(groups.get(key) ?? []), expense]);
  }
  return [...groups].map(([key, items]) => ({
    key,
    label: key === 'overdue' ? 'Scadute' : monthLabel(`${key}-01`),
    expenses: items,
  }));
}

function monthLabel(value: string): string {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric', timeZone: 'Europe/Rome' })
    .format(new Date(Date.UTC(year, month - 1, 1, 12)));
}
