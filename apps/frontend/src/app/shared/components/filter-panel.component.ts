import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  template: `
    <section class="filters card mb-4" [attr.aria-labelledby]="titleId()">
      <div class="filters__header">
        <div class="min-w-0">
          <div class="d-flex flex-wrap align-items-center gap-2">
            <h2 class="h6 mb-0" [id]="titleId()">
              <i class="bi bi-funnel me-2" aria-hidden="true"></i>{{ title() }}
            </h2>
            @if (activeCount() > 0) {
              <span class="badge rounded-pill filters__count">
                {{ activeCount() }} {{ activeCount() === 1 ? 'attivo' : 'attivi' }}
              </span>
            }
          </div>
          @if (!expanded()) {
            <p class="filters__summary mb-0 mt-1">{{ summary() }}</p>
          }
        </div>
        <div class="d-flex flex-shrink-0 gap-2">
          @if (!expanded() && activeCount() > 0) {
            <button class="btn btn-sm btn-outline-secondary" type="button" (click)="resetRequested.emit()">
              <i class="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>
              <span class="d-none d-sm-inline">Reimposta</span>
              <span class="visually-hidden d-sm-none">Reimposta filtri</span>
            </button>
          }
          <button
            class="btn btn-sm btn-outline-primary filters__toggle"
            type="button"
            [attr.aria-controls]="panelId()"
            [attr.aria-expanded]="expanded()"
            [attr.aria-label]="expanded() ? 'Chiudi pannello filtri' : 'Apri pannello filtri'"
            (click)="expandedChange.emit(!expanded())"
          >
            <span class="d-none d-sm-inline">{{ expanded() ? 'Nascondi' : 'Mostra' }}</span>
            <i class="bi ms-sm-2" [class.bi-chevron-up]="expanded()" [class.bi-chevron-down]="!expanded()" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      @if (expanded()) {
        <div class="filters__panel" [id]="panelId()">
          <ng-content />
        </div>
      }
    </section>
  `,
  styles: [`
    .filters { overflow: visible; }
    .filters__header { display:flex; gap:1rem; align-items:center; justify-content:space-between; min-height:4.5rem; padding:1rem 1.15rem; background:var(--surface-soft); border-radius:var(--radius-lg); }
    .filters__panel { padding:1.15rem; background:var(--form-surface); border-top:1px solid var(--border-color); border-radius:0 0 var(--radius-lg) var(--radius-lg); }
    .filters__summary { max-width:min(72vw,52rem); overflow:hidden; color:var(--text-secondary); font-size:.82rem; text-overflow:ellipsis; white-space:nowrap; }
    .filters__count { color:var(--primary-selected-color); background:var(--primary-selected-bg); border:1px solid var(--primary-selected-border); }
    .filters__toggle { min-width:2.4rem; }
    @media (max-width:575.98px) { .filters__header,.filters__panel { padding:.9rem; } }
  `],
})
export class FilterPanelComponent {
  readonly title = input('Filtri');
  readonly titleId = input.required<string>();
  readonly panelId = input.required<string>();
  readonly expanded = input.required<boolean>();
  readonly activeCount = input(0);
  readonly summary = input('Nessun filtro applicato');
  readonly expandedChange = output<boolean>();
  readonly resetRequested = output<void>();
}
