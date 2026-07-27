import { Component, inject, input, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { CategoryBadgeComponent } from '../../shared/components/catalog-display.components';
import { EuroAmountPipe, ExpenseStatusBadgeComponent, ItalianExpenseDatePipe } from '../../shared/components/expense-display.components';
import type { RecentExpense } from '../../shared/models/dashboard.models';
import { RecurrenceExpenseIndicatorComponent } from '../recurrences/recurrence-display.components';

@Component({
  selector: 'app-recent-expenses',
  standalone: true,
  imports: [RouterLink, CategoryBadgeComponent, EuroAmountPipe, ExpenseStatusBadgeComponent, ItalianExpenseDatePipe, RecurrenceExpenseIndicatorComponent],
  template: `
    @if (expenses().length === 0) {
      <div class="empty-list"><i class="bi bi-receipt" aria-hidden="true"></i><p>Nessun inserimento recente.</p></div>
    } @else {
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead><tr><th>Data</th><th>Descrizione</th><th>Importo</th><th>Categoria</th><th>Stato</th><th><span class="visually-hidden">Azioni</span></th></tr></thead>
          <tbody>
            @for (expense of expenses(); track expense.id) {
              <tr
                class="recent-row"
                [class.recent-row--planned]="expense.status === 'PLANNED'"
                tabindex="0"
                [attr.aria-label]="'Apri dettaglio di ' + expense.description"
                (click)="open(expense)"
                (keydown.enter)="open(expense, $event)"
                (keydown.space)="open(expense, $event)"
              >
                <td class="text-nowrap">{{ expense.expenseDate | italianExpenseDate }}</td>
                <td>
                  <a [routerLink]="['/expenses', expense.id]" (click)="$event.stopPropagation()">{{ expense.description }}</a>
                  @if (expense.recurrence; as recurrence) {
                    <div class="mt-1">
                      <app-recurrence-expense-indicator [recurrenceId]="recurrence.id" [recurrenceName]="recurrence.name" />
                    </div>
                  }
                </td>
                <td class="text-nowrap fw-semibold">{{ expense.amount | euroAmount }}</td>
                <td><app-category-badge [name]="expense.category.name" [color]="expense.category.color" [icon]="expense.category.icon" /></td>
                <td><app-expense-status-badge [status]="expense.status" /></td>
                <td class="text-end text-nowrap" (click)="$event.stopPropagation()" (keydown)="$event.stopPropagation()">
                  <a class="btn btn-sm btn-outline-secondary me-1" [routerLink]="['/expenses', expense.id, 'edit']" aria-label="Modifica spesa"><i class="bi bi-pencil" aria-hidden="true"></i></a>
                  <button class="btn btn-sm btn-outline-secondary" type="button" (click)="duplicate.emit(expense)" aria-label="Duplica spesa"><i class="bi bi-copy" aria-hidden="true"></i></button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    .empty-list { display:grid; min-height:11rem; color:var(--text-secondary); text-align:center; place-content:center; }
    .empty-list i { font-size:1.7rem; }
    .empty-list p { margin:.5rem 0; }
    .table { font-size:.88rem; }
    a { font-weight:650; }
    .recent-row { cursor:pointer; }
    .recent-row:focus-visible { position:relative; z-index:1; outline:3px solid rgb(var(--primary-rgb) / 35%); outline-offset:-3px; }
    .recent-row--planned > * { --bs-table-bg:var(--warning-soft); --bs-table-hover-bg:color-mix(in srgb, var(--warning) 24%, var(--surface)); background-color:var(--bs-table-bg); }
    .recent-row--planned:hover > * { background-color:var(--bs-table-hover-bg); }
  `],
})
export class RecentExpensesComponent {
  private readonly router = inject(Router);
  readonly expenses = input.required<readonly RecentExpense[]>();
  readonly duplicate = output<RecentExpense>();

  open(expense: RecentExpense, event?: Event): void {
    event?.preventDefault();
    void this.router.navigate(['/expenses', expense.id]);
  }
}
