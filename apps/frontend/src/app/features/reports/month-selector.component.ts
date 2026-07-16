import { Component, input, output } from '@angular/core';

import type { MonthlyReportQuery } from '../../shared/models/report.models';
import { ITALIAN_MONTHS } from '../../shared/utilities/dashboard-format';

@Component({
  selector: 'app-month-selector',
  standalone: true,
  template: `
    <fieldset class="period-selector">
      <legend class="h6 mb-2">{{ label() }}</legend>
      <div class="d-flex flex-wrap gap-2">
        <label class="visually-hidden" [for]="idPrefix() + '-month'">Mese</label>
        <select
          class="form-select"
          [id]="idPrefix() + '-month'"
          [value]="period().month"
          (change)="changeMonth($event)"
        >
          @for (month of months; track $index) {
            <option [value]="$index + 1" [selected]="period().month === $index + 1">{{ month }}</option>
          }
        </select>
        <label class="visually-hidden" [for]="idPrefix() + '-year'">Anno</label>
        <select
          class="form-select"
          [id]="idPrefix() + '-year'"
          [value]="period().year"
          (change)="changeYear($event)"
        >
          @for (year of years; track year) { <option [value]="year" [selected]="period().year === year">{{ year }}</option> }
        </select>
      </div>
    </fieldset>
  `,
  styles: [`
    .period-selector { min-width: 0; padding: 0; margin: 0; border: 0; }
    .form-select { width: auto; min-width: 9rem; }
    @media (max-width: 575.98px) { .form-select { width: 100%; } }
  `],
})
export class MonthSelectorComponent {
  readonly label = input('Periodo');
  readonly idPrefix = input('period');
  readonly period = input.required<MonthlyReportQuery>();
  readonly periodChange = output<MonthlyReportQuery>();
  readonly months = ITALIAN_MONTHS;
  readonly years = Array.from({ length: 101 }, (_, index) => 2000 + index);

  changeMonth(event: Event): void {
    this.periodChange.emit({
      ...this.period(),
      month: Number((event.target as HTMLSelectElement).value),
    });
  }

  changeYear(event: Event): void {
    this.periodChange.emit({
      ...this.period(),
      year: Number((event.target as HTMLSelectElement).value),
    });
  }
}
