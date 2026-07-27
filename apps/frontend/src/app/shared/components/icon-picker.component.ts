import {
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

import {
  ICON_CATALOG,
  ICON_GROUPS,
  ICON_KEYS,
  type IconCatalogItem,
} from '../models/icon-catalog';

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  template: `
    <div class="icon-picker">
      <div class="row g-2">
        <div class="col-12 col-sm">
          <label class="form-label" [for]="inputId()">Cerca icona</label>
          <input
            class="form-control form-control-sm"
            type="search"
            [id]="inputId()"
            [value]="query()"
            placeholder="Es. casa, auto, regalo"
            (input)="onSearch($event)"
          />
        </div>
        <div class="col-12 col-sm-auto">
          <label class="form-label" [for]="inputId() + '-group'">Gruppo</label>
          <select
            class="form-select form-select-sm"
            [id]="inputId() + '-group'"
            [value]="group()"
            (change)="onGroup($event)"
          >
            <option value="">Tutti</option>
            @for (item of groups(); track item) { <option [value]="item">{{ item }}</option> }
          </select>
        </div>
      </div>
      @if (currentHidden(); as hidden) {
        <p class="small text-body-secondary mt-2 mb-1">
          L’icona attuale è nascosta dalle preferenze, ma resta disponibile per questo record.
        </p>
        <button
          type="button"
          class="icon-option current-hidden"
          [class.selected]="isSelected(hidden.key)"
          [attr.aria-label]="hidden.label"
          (click)="toggle(hidden.key)"
        ><i class="bi" [class]="hidden.key" aria-hidden="true"></i></button>
      }
      <div
        class="icon-grid mt-2"
        role="listbox"
        [attr.aria-multiselectable]="multiple()"
        aria-label="Icone disponibili"
      >
        @for (icon of filteredIcons(); track icon.key; let index = $index) {
          <button
            #iconButton
            type="button"
            class="icon-option"
            [class.selected]="isSelected(icon.key)"
            [attr.aria-selected]="isSelected(icon.key)"
            [attr.aria-label]="'Seleziona ' + icon.key"
            [title]="icon.label"
            (click)="toggle(icon.key)"
            (keydown)="moveFocus($event, index)"
          >
            <i class="bi" [class]="icon.key" aria-hidden="true"></i>
          </button>
        } @empty {
          <p class="small text-body-secondary mb-0 grid-message">Nessuna icona trovata.</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .icon-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(2.65rem, 1fr));
      gap: 0.45rem;
      max-height: 13rem;
      overflow: auto;
    }
    .icon-option {
      min-width: 2.65rem;
      min-height: 2.65rem;
      color: var(--text-primary);
      background: var(--form-surface);
      border: 1px solid var(--border-strong);
      border-radius: 0.55rem;
    }
    .icon-option:hover,
    .icon-option.selected {
      color: var(--primary-strong);
      background: var(--surface-accent);
      border-color: var(--primary);
    }
    .icon-option.selected { box-shadow: 0 0 0 2px rgb(var(--primary-rgb) / 26%); }
    .current-hidden { display: inline-grid; place-items: center; border-style: dashed; }
    .grid-message { grid-column: 1 / -1; }
  `],
})
export class IconPickerComponent {
  @ViewChildren('iconButton') private iconButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  readonly value = input<string | null>(null);
  readonly inputId = input('icon-search');
  readonly availableIcons = input<readonly string[]>(ICON_KEYS);
  readonly multiple = input(false);
  readonly selectedIcons = input<readonly string[]>([]);
  readonly valueChange = output<string>();
  readonly selectionChange = output<readonly string[]>();
  readonly query = signal('');
  readonly group = signal('');
  readonly catalog = computed(() => {
    const allowed = new Set(this.availableIcons());
    return ICON_CATALOG.filter((item) => allowed.has(item.key));
  });
  readonly groups = computed(() =>
    ICON_GROUPS.filter((group) => this.catalog().some((item) => item.group === group)),
  );
  readonly currentHidden = computed<IconCatalogItem | null>(() => {
    const current = this.value();
    if (!current || this.availableIcons().includes(current) || !/^bi-[a-z0-9-]+$/.test(current)) {
      return null;
    }
    return ICON_CATALOG.find((item) => item.key === current) ?? {
      key: current,
      label: 'Icona attuale',
      group: 'Generali',
    };
  });
  readonly filteredIcons = computed(() => {
    const query = this.query().trim().toLowerCase().replace(/^bi-/, '');
    const group = this.group();
    return this.catalog().filter((icon) =>
      (!group || icon.group === group) &&
      (!query || icon.key.includes(query) || icon.label.toLowerCase().includes(query)),
    );
  });

  onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  onGroup(event: Event): void {
    this.group.set((event.target as HTMLSelectElement).value);
  }

  toggle(icon: string): void {
    if (!this.multiple()) {
      this.valueChange.emit(icon);
      return;
    }
    const selected = new Set(this.selectedIcons());
    if (selected.has(icon)) selected.delete(icon);
    else selected.add(icon);
    this.selectionChange.emit([...selected]);
  }

  isSelected(icon: string): boolean {
    return this.multiple() ? this.selectedIcons().includes(icon) : this.value() === icon;
  }

  moveFocus(event: KeyboardEvent, index: number): void {
    const columns = Math.max(1, Math.floor((event.currentTarget as HTMLElement).parentElement!.clientWidth / 49));
    const offset = event.key === 'ArrowRight' ? 1
      : event.key === 'ArrowLeft' ? -1
        : event.key === 'ArrowDown' ? columns
          : event.key === 'ArrowUp' ? -columns
            : 0;
    if (!offset) return;
    event.preventDefault();
    const buttons = this.iconButtons.toArray();
    buttons[Math.max(0, Math.min(buttons.length - 1, index + offset))]?.nativeElement.focus();
  }
}
