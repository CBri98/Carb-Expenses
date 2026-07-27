import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';

import type { MonthlyReportQuery } from '../../shared/models/report.models';
import { ITALIAN_MONTHS } from '../../shared/utilities/dashboard-format';

@Component({
  selector: 'app-month-selector',
  standalone: true,
  imports: [FormsModule, NgSelectComponent],
  template: `
    <fieldset class="period-selector">
      <legend class="h6 mb-2">{{ label() }}</legend>
      <div class="d-flex flex-wrap gap-2">
        <label class="visually-hidden" [for]="idPrefix() + '-month'">Mese</label>
        <ng-select
          class="period-selector__month"
          [labelForId]="idPrefix() + '-month'"
          [items]="monthOptions"
          bindLabel="label"
          bindValue="value"
          [clearable]="false"
          [searchable]="false"
          [ngModel]="period().month"
          (ngModelChange)="changeMonth($event)"
          ariaLabel="Mese del periodo"
        >
          <ng-template ng-option-tmp let-item="item"><span class="month-option"><strong>{{ item.code }}</strong><span>{{ item.label }}</span></span></ng-template>
          <ng-template ng-label-tmp let-item="item"><span class="month-option"><strong>{{ item.code }}</strong><span>— {{ item.label }}</span></span></ng-template>
        </ng-select>
        <label class="visually-hidden" [for]="idPrefix() + '-year'">Anno</label>
        <input
          class="form-control period-selector__year"
          [id]="idPrefix() + '-year'"
          type="number"
          min="2000"
          max="2100"
          step="1"
          [value]="period().year"
          (change)="changeYear($event)"
        >
      </div>
    </fieldset>
  `,
  styles: [`
    .period-selector { min-width: 0; padding: 0; margin: 0; border: 0; }
    .period-selector__month { width: 11rem; }
    .period-selector__year { width: 7rem; }
    .month-option { display:inline-flex; gap:.55rem; align-items:center; }
    .month-option strong { min-width:1.5rem; font-family:var(--bs-font-monospace); }
    @media (max-width: 575.98px) { .period-selector__month,.period-selector__year { width: 100%; } }
  `],
})
export class MonthSelectorComponent {
  readonly label = input('Periodo');
  readonly idPrefix = input('period');
  readonly period = input.required<MonthlyReportQuery>();
  readonly periodChange = output<MonthlyReportQuery>();
  readonly monthOptions = ITALIAN_MONTHS.map((label, index) => ({
    value: index + 1,
    code: String(index + 1).padStart(2, '0'),
    label,
  }));

  changeMonth(month: number): void {
    if (!Number.isInteger(month) || month < 1 || month > 12) return;
    this.periodChange.emit({
      ...this.period(),
      month,
    });
  }

  changeYear(event: Event): void {
    const year = Number((event.target as HTMLInputElement).value);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) return;
    this.periodChange.emit({
      ...this.period(),
      year,
    });
  }
}
