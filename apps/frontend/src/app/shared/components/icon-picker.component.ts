import { Component, computed, input, output, signal } from '@angular/core';

const AVAILABLE_ICONS = [
  'bi-house',
  'bi-house-door',
  'bi-building',
  'bi-receipt',
  'bi-basket',
  'bi-cup-hot',
  'bi-bus-front',
  'bi-fuel-pump',
  'bi-car-front',
  'bi-heart-pulse',
  'bi-capsule',
  'bi-bag',
  'bi-controller',
  'bi-airplane',
  'bi-arrow-repeat',
  'bi-mortarboard',
  'bi-gift',
  'bi-bank',
  'bi-briefcase',
  'bi-heart',
  'bi-tag',
  'bi-cart',
  'bi-phone',
  'bi-laptop',
  'bi-tools',
  'bi-lightning',
  'bi-tree',
  'bi-piggy-bank',
  'bi-stars',
  'bi-three-dots',
] as const;

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  template: `
    <div class="icon-picker">
      <label class="form-label" [for]="inputId()">Cerca icona</label>
      <input
        class="form-control form-control-sm"
        type="search"
        [id]="inputId()"
        [value]="query()"
        placeholder="Es. casa, auto, regalo"
        (input)="onSearch($event)"
      />
      <div class="icon-grid mt-2" role="listbox" aria-label="Icone disponibili">
        @for (icon of filteredIcons(); track icon) {
          <button
            type="button"
            class="icon-option"
            [class.selected]="value() === icon"
            [attr.aria-selected]="value() === icon"
            [attr.aria-label]="'Seleziona ' + icon"
            (click)="valueChange.emit(icon)"
          >
            <i class="bi" [class]="icon" aria-hidden="true"></i>
          </button>
        } @empty {
          <p class="small text-body-secondary mb-0">Nessuna icona trovata.</p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .icon-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(2.55rem, 1fr));
        gap: 0.4rem;
        max-height: 9.5rem;
        overflow: auto;
      }
      .icon-option {
        min-height: 2.55rem;
        color: var(--text-primary);
        background: var(--form-surface);
        border: 1px solid var(--border-strong);
        border-radius: 0.55rem;
      }
      .icon-option:hover,
      .icon-option.selected {
        color: var(--primary-strong);
        background: var(--primary-soft);
        border-color: var(--primary);
      }
      .icon-option.selected {
        box-shadow: 0 0 0 2px rgb(124 131 214 / 22%);
      }
    `,
  ],
})
export class IconPickerComponent {
  readonly value = input<string | null>(null);
  readonly inputId = input('icon-search');
  readonly valueChange = output<string>();
  readonly query = signal('');
  readonly filteredIcons = computed(() => {
    const query = this.query().trim().toLowerCase().replace(/^bi-/, '');
    return query ? AVAILABLE_ICONS.filter((icon) => icon.includes(query)) : AVAILABLE_ICONS;
  });

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }
}
