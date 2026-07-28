import { Component, computed, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';

import { CategoryBadgeComponent } from '../../shared/components/catalog-display.components';
import { EuroAmountPipe, ItalianExpenseDatePipe } from '../../shared/components/expense-display.components';
import type { UpcomingExpense } from '../../shared/models/dashboard.models';
import { dueLabel } from '../../shared/utilities/dashboard-format';
import { RecurrenceExpenseIndicatorComponent } from '../recurrences/recurrence-display.components';

@Component({
  selector: 'app-upcoming-expenses',
  standalone: true,
  imports: [CategoryBadgeComponent, EuroAmountPipe, ItalianExpenseDatePipe, RecurrenceExpenseIndicatorComponent],
  template: `
    @if (expenses().length === 0) {
      <div class="empty-list"><i class="bi bi-calendar2-check" aria-hidden="true"></i><p>Non ci sono spese future pianificate.</p></div>
    } @else {
      @for (group of groups(); track group.key) {
      <section class="upcoming-group" [attr.aria-labelledby]="'upcoming-group-' + group.key">
        <h3 class="upcoming-group__title" [id]="'upcoming-group-' + group.key">{{ group.label }}</h3>
        <ul class="list-group list-group-flush">
        @for (expense of group.expenses; track expense.id) {
          <li class="upcoming-item list-group-item px-3 py-3" tabindex="0" role="link" [attr.aria-label]="'Apri dettaglio di ' + expense.description" (click)="open(expense)" (keydown.enter)="open(expense, $event)" (keydown.space)="open(expense, $event)">
            <div class="d-flex gap-3 justify-content-between">
              <div class="min-w-0">
                <span class="due">{{ due(expense) }}</span>
                <strong class="d-block text-truncate mt-1">{{ expense.description }}</strong>
                @if (expense.recurrence; as recurrence) { <div class="mt-1"><app-recurrence-expense-indicator [recurrenceId]="recurrence.id" [recurrenceName]="recurrence.name" /></div> }
                <small class="text-body-secondary d-block mt-1">{{ expense.expenseDate | italianExpenseDate }}</small>
                <div class="mt-2"><app-category-badge [name]="expense.category.name" [color]="expense.category.color" [icon]="expense.category.icon" /></div>
              </div>
              <div class="text-end">
                <strong class="d-block text-nowrap">{{ expense.amount | euroAmount }}</strong>
                <button class="btn btn-sm btn-outline-primary mt-2" type="button" (click)="$event.stopPropagation(); complete.emit(expense)"><i class="bi bi-check-lg me-1" aria-hidden="true"></i>Completa</button>
              </div>
            </div>
          </li>
        }
        </ul>
      </section>
      }
    }
  `,
  styles: [`.empty-list{display:grid;min-height:11rem;color:var(--text-secondary);text-align:center;place-content:center}.empty-list i{font-size:1.7rem}.empty-list p{margin:.5rem 0}.due{color:var(--primary-strong);font-size:.75rem;font-weight:750;text-transform:uppercase;transition:color var(--theme-motion)}.min-w-0{min-width:0}.upcoming-group__title{margin:1rem 0 .45rem;color:var(--text-secondary);font-size:.75rem;font-weight:800;letter-spacing:.05em;text-transform:uppercase}.upcoming-group:first-child .upcoming-group__title{margin-top:0}.upcoming-item{margin-bottom:.55rem;background:var(--surface-soft);border:1px solid var(--border-color)!important;border-left:3px solid var(--primary)!important;border-radius:.7rem!important;cursor:pointer;transition:color var(--theme-motion),background-color var(--theme-motion),transform var(--motion-fast),border-color var(--motion-fast),box-shadow var(--motion-fast)}.upcoming-item:hover{border-color:var(--primary-selected-border)!important;box-shadow:var(--shadow-sm);transform:translateY(-1px)}.upcoming-item:focus-visible{outline:var(--focus-ring);outline-offset:2px}`],
})
export class UpcomingExpensesComponent {
  private readonly router = inject(Router);
  readonly expenses = input.required<readonly UpcomingExpense[]>();
  readonly complete = output<UpcomingExpense>();
  readonly groups = computed(() => groupUpcoming(this.expenses()));
  due(expense: UpcomingExpense): string { return dueLabel(expense.daysUntilDue, expense.expenseDate); }
  open(expense: UpcomingExpense, event?: Event): void {
    event?.preventDefault();
    void this.router.navigate(['/expenses', expense.id]);
  }
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
