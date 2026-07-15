import { Component, input, output } from '@angular/core';

const PALETTE = [
  '#2563EB',
  '#4F46E5',
  '#7C3AED',
  '#C026D3',
  '#DB2777',
  '#DC2626',
  '#EA580C',
  '#CA8A04',
  '#16A34A',
  '#0F766E',
  '#0891B2',
  '#475569',
] as const;

@Component({
  selector: 'app-color-picker',
  standalone: true,
  template: `
    <div class="row g-2 align-items-end">
      <div class="col-auto">
        <label class="form-label" [for]="colorId()">Colore</label>
        <input
          class="form-control form-control-color"
          type="color"
          [id]="colorId()"
          [value]="validColor()"
          (input)="emitValue($event)"
          title="Scegli un colore"
        />
      </div>
      <div class="col">
        <label class="form-label" [for]="textId()">Valore esadecimale</label>
        <input
          class="form-control text-uppercase"
          type="text"
          [id]="textId()"
          [value]="value()"
          maxlength="7"
          placeholder="#2563EB"
          (input)="emitValue($event)"
        />
      </div>
    </div>
    <div class="palette mt-2" aria-label="Palette colori suggeriti">
      @for (color of palette; track color) {
        <button
          type="button"
          class="swatch"
          [class.selected]="value().toUpperCase() === color"
          [style.background-color]="color"
          [attr.aria-label]="'Seleziona il colore ' + color"
          [attr.title]="color"
          (click)="valueChange.emit(color)"
        ></button>
      }
    </div>
  `,
  styles: [
    `
      .form-control-color {
        width: 3.5rem;
        min-height: 2.4rem;
      }
      .palette {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }
      .swatch {
        width: 1.65rem;
        height: 1.65rem;
        border: 2px solid var(--surface);
        border-radius: 50%;
        box-shadow: 0 0 0 1px var(--border-strong);
      }
      .swatch.selected {
        box-shadow: 0 0 0 3px rgb(124 131 214 / 35%);
      }
    `,
  ],
})
export class ColorPickerComponent {
  readonly value = input('#2563EB');
  readonly colorId = input('catalog-color');
  readonly textId = input('catalog-color-text');
  readonly valueChange = output<string>();
  readonly palette = PALETTE;

  validColor(): string {
    return /^#[0-9A-Fa-f]{6}$/.test(this.value()) ? this.value() : '#2563EB';
  }

  emitValue(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value.toUpperCase());
  }
}
