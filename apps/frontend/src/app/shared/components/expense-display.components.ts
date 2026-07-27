import { Pipe, PipeTransform, Component, input } from '@angular/core';

import type { ExpenseStatus, PaymentMethod } from '../models/expense.models';
import {
  expenseStatusLabel,
  formatEuroAmount,
  formatItalianDate,
  formatItalianDateTime,
  formatItalianExtendedDate,
  paymentMethodLabel,
} from '../utilities/expense-format';

@Pipe({ name: 'euroAmount', standalone: true })
export class EuroAmountPipe implements PipeTransform {
  transform(value: string | number): string {
    return formatEuroAmount(String(value));
  }
}

@Pipe({ name: 'italianExpenseDate', standalone: true })
export class ItalianExpenseDatePipe implements PipeTransform {
  transform(value: string): string {
    return formatItalianDate(value);
  }
}

@Pipe({ name: 'italianExtendedDate', standalone: true })
export class ItalianExtendedDatePipe implements PipeTransform {
  transform(value: string): string {
    return formatItalianExtendedDate(value);
  }
}

@Pipe({ name: 'italianDateTime', standalone: true })
export class ItalianDateTimePipe implements PipeTransform {
  transform(value: string): string {
    return formatItalianDateTime(value);
  }
}

@Component({
  selector: 'app-expense-status-badge',
  standalone: true,
  template: `<span class="badge" [class.text-bg-success]="status() === 'COMPLETED'" [class.text-bg-warning]="status() === 'PLANNED'" [class.text-bg-secondary]="status() === 'CANCELLED'"><i class="bi me-1" [class.bi-check-circle]="status() === 'COMPLETED'" [class.bi-clock]="status() === 'PLANNED'" [class.bi-x-circle]="status() === 'CANCELLED'" aria-hidden="true"></i>{{ label() }}</span>`,
})
export class ExpenseStatusBadgeComponent {
  readonly status = input.required<ExpenseStatus>();
  label(): string {
    return expenseStatusLabel(this.status());
  }
}

@Component({
  selector: 'app-payment-method-badge',
  standalone: true,
  template: `<span class="text-nowrap"><i class="bi bi-credit-card me-1 text-body-secondary" aria-hidden="true"></i>{{ label() }}</span>`,
})
export class PaymentMethodBadgeComponent {
  readonly method = input.required<PaymentMethod>();
  label(): string {
    return paymentMethodLabel(this.method());
  }
}
