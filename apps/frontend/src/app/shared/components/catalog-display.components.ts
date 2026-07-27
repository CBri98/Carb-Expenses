import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `<header class="mb-4">
    <p class="text-primary text-uppercase small fw-bold mb-1">{{ eyebrow() }}</p>
    <div class="d-flex flex-wrap gap-3 justify-content-between align-items-start">
      <div>
        <h1 class="h2 mb-1">{{ title() }}</h1>
        <p class="text-body-secondary mb-0">{{ subtitle() }}</p>
      </div>
      <ng-content />
    </div>
  </header>`,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly eyebrow = input('Impostazioni');
}

@Component({
  selector: 'app-category-badge',
  standalone: true,
  template: `<span
    class="category-badge badge rounded-pill border"
    [style.color]="color()"
    [style.border-color]="color()"
    ><i class="bi me-1" [class]="icon()" aria-hidden="true"></i>{{ name() }}</span
  >`,
  styles: [`.category-badge { background: var(--surface) !important; }`],
})
export class CategoryBadgeComponent {
  readonly name = input.required<string>();
  readonly color = input.required<string>();
  readonly icon = input.required<string>();
}

@Component({
  selector: 'app-label-badge',
  standalone: true,
  template: `<span class="badge rounded-pill text-white" [style.background-color]="color()"
    ><i class="bi me-1" [class]="icon() || 'bi-tag'" aria-hidden="true"></i>{{ name() }}</span
  >`,
})
export class LabelBadgeComponent {
  readonly name = input.required<string>();
  readonly color = input.required<string>();
  readonly icon = input<string | null>(null);
}

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `<span
    class="badge"
    [class.text-bg-success]="active()"
    [class.text-bg-secondary]="!active()"
    ><i class="bi me-1" [class.bi-check-circle]="active()" [class.bi-pause-circle]="!active()"></i
    >{{ active() ? 'Attiva' : 'Disattivata' }}</span
  >`,
})
export class StatusBadgeComponent {
  readonly active = input.required<boolean>();
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `<div class="text-center py-5">
    <i class="bi bi-inbox fs-1 text-body-tertiary" aria-hidden="true"></i>
    <h2 class="h5 mt-3">{{ title() }}</h2>
    <p class="text-body-secondary">{{ message() }}</p>
    <div class="empty-state__actions"><ng-content /></div>
  </div>`,
  styles: [`
    .empty-state__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: .65rem; }
    .empty-state__actions:empty { display: none; }
  `],
})
export class EmptyStateComponent {
  readonly title = input('Nessun elemento');
  readonly message = input('Prova a modificare i filtri o crea un nuovo elemento.');
}

@Component({
  selector: 'app-loading-skeleton',
  standalone: true,
  template: `<div class="placeholder-glow p-4" aria-live="polite" aria-label="Caricamento in corso">
    <span class="placeholder col-12 mb-3"></span><span class="placeholder col-9 mb-3"></span
    ><span class="placeholder col-11"></span>
  </div>`,
})
export class LoadingSkeletonComponent {}

@Component({
  selector: 'app-counter-card',
  standalone: true,
  template: `<article class="card counter-card h-100"><div class="card-body d-flex align-items-center gap-3">
    <span class="counter-card__icon" aria-hidden="true"><i class="bi" [class]="icon()"></i></span>
    <div><span class="small text-body-secondary">{{ label() }}</span><strong class="d-block fs-4">{{ value() }}</strong></div>
  </div></article>`,
  styles: [`
    .counter-card { border: 0; box-shadow: var(--shadow-sm); }
    .counter-card__icon { display: grid; width: 2.5rem; height: 2.5rem; flex: 0 0 auto; color: var(--primary); background: var(--primary-soft); border-radius: .7rem; place-items: center; }
  `],
})
export class CounterCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number | string>();
  readonly icon = input('bi-bar-chart');
}

@Component({
  selector: 'app-search-input',
  standalone: true,
  template: `<label class="visually-hidden" [for]="inputId()">Cerca</label>
    <div class="input-group">
      <span class="input-group-text"><i class="bi bi-search" aria-hidden="true"></i></span
      ><input
        class="form-control"
        type="search"
        [id]="inputId()"
        [value]="value()"
        placeholder="Cerca…"
        (input)="onInput($event)"
      />
    </div>`,
})
export class SearchInputComponent {
  readonly inputId = input('catalog-search');
  readonly value = input('');
  readonly changed = output<string>();

  onInput(event: Event): void {
    this.changed.emit((event.target as HTMLInputElement).value);
  }
}
