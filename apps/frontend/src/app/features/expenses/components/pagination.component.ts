import { Component, computed, input, output } from '@angular/core';
import type { PaginationMeta } from '../../../shared/models/expense.models';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (meta().totalPages > 0) {
      <nav class="d-flex flex-wrap gap-3 justify-content-between align-items-center p-3 border-top" aria-label="Paginazione spese">
        <span class="small text-body-secondary">Pagina {{ meta().page }} di {{ meta().totalPages }} · {{ meta().totalItems }} risultati</span>
        <ul class="pagination pagination-sm mb-0">
          <li class="page-item" [class.disabled]="meta().page <= 1"><button class="page-link" type="button" [disabled]="meta().page <= 1" (click)="pageChange.emit(meta().page - 1)">Precedente</button></li>
          @for (page of pages(); track page) { <li class="page-item" [class.active]="page === meta().page"><button class="page-link" type="button" (click)="pageChange.emit(page)" [attr.aria-current]="page === meta().page ? 'page' : null">{{ page }}</button></li> }
          <li class="page-item" [class.disabled]="meta().page >= meta().totalPages"><button class="page-link" type="button" [disabled]="meta().page >= meta().totalPages" (click)="pageChange.emit(meta().page + 1)">Successiva</button></li>
        </ul>
      </nav>
    }
  `,
})
export class PaginationComponent {
  readonly meta = input.required<PaginationMeta>();
  readonly pageChange = output<number>();
  readonly pages = computed(() => {
    const current = this.meta().page;
    const total = this.meta().totalPages;
    const start = Math.max(1, Math.min(current - 2, total - 4));
    const end = Math.min(total, start + 4);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
  });
}
