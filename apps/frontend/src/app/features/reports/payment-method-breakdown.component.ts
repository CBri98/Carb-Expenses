import { Component, computed, input, output } from '@angular/core';

import { DashboardChartComponent, type DashboardChartSelection } from '../dashboard/dashboard-chart.component';
import { EuroAmountPipe, PaymentMethodBadgeComponent } from '../../shared/components/expense-display.components';
import type { PaymentMethodReportItem } from '../../shared/models/report.models';

@Component({
  selector: 'app-payment-method-breakdown',
  standalone: true,
  imports: [DashboardChartComponent, EuroAmountPipe, PaymentMethodBadgeComponent],
  template: `
    @if (items().length) {
      <app-dashboard-chart
        type="bar"
        [horizontal]="true"
        [labels]="labels()"
        [values]="values()"
        [counts]="counts()"
        datasetLabel="Spese completate"
        ariaLabel="Breakdown delle spese completate per metodo di pagamento"
        (pointSelected)="selectPoint($event)"
      />
      <div class="table-responsive mt-3">
        <table class="table table-sm align-middle mb-0">
          <caption class="visually-hidden">Dettaglio accessibile per metodo di pagamento</caption>
          <thead><tr><th>Metodo</th><th class="text-end">Importo</th><th class="text-end">Transazioni</th><th class="text-end">Quota</th></tr></thead>
          <tbody>
            @for (item of items(); track item.paymentMethod) {
              <tr>
                <td><app-payment-method-badge [method]="item.paymentMethod" /></td>
                <td class="text-end">{{ item.total | euroAmount }}</td>
                <td class="text-end">{{ item.expenseCount }}</td>
                <td class="text-end">{{ item.percentage }}%</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <p class="text-body-secondary text-center py-5 mb-0">Nessun metodo di pagamento da riepilogare.</p>
    }
  `,
})
export class PaymentMethodBreakdownComponent {
  readonly items = input.required<readonly PaymentMethodReportItem[]>();
  readonly labels = computed(() => this.items().map((item) => paymentLabel(item.paymentMethod)));
  readonly values = computed(() => this.items().map((item) => Number(item.total)));
  readonly counts = computed(() => this.items().map((item) => item.expenseCount));
  readonly selected = output<PaymentMethodReportItem['paymentMethod']>();

  selectPoint(selection: DashboardChartSelection): void {
    const item = this.items()[selection.index];
    if (item) this.selected.emit(item.paymentMethod);
  }
}

function paymentLabel(method: PaymentMethodReportItem['paymentMethod']): string {
  const labels: Record<PaymentMethodReportItem['paymentMethod'], string> = {
    CASH: 'Contanti',
    DEBIT_CARD: 'Carta di debito',
    CREDIT_CARD: 'Carta di credito',
    BANK_TRANSFER: 'Bonifico',
    DIRECT_DEBIT: 'Addebito diretto',
    DIGITAL_WALLET: 'Portafoglio digitale',
    CHECK: 'Assegno',
    OTHER: 'Altro',
  };
  return labels[method];
}
