import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-multiselect-value',
  standalone: true,
  template: `
    <span class="multi-value" [style.--multi-value-color]="color() || 'var(--primary-strong)'">
      <span class="multi-value__label" [attr.title]="label()">
        @if (icon()) { <i class="bi" [class]="icon()" aria-hidden="true"></i> }
        <span>{{ label() }}</span>
      </span>
      <button
        class="multi-value__remove"
        type="button"
        [attr.aria-label]="'Rimuovi ' + label()"
        [attr.title]="'Rimuovi ' + label()"
        (mousedown)="$event.preventDefault(); $event.stopPropagation()"
        (click)="$event.stopPropagation(); removed.emit()"
      >
        <i class="bi bi-x" aria-hidden="true"></i>
      </button>
    </span>
  `,
  styles: [`
    :host { display: inline-flex; min-width: 0; max-width: 100%; }
    .multi-value { display:inline-flex; min-width:0; max-width:100%; overflow:hidden; color:var(--text-primary); background:color-mix(in srgb,var(--multi-value-color) 12%,var(--surface)); border:1px solid color-mix(in srgb,var(--multi-value-color) 42%,var(--border-color)); border-radius:999px; }
    .multi-value__label { display:inline-flex; min-width:0; gap:.35rem; align-items:center; padding:.24rem .5rem .24rem .6rem; overflow:hidden; }
    .multi-value__label i { flex:0 0 auto; color:var(--multi-value-color); }
    .multi-value__label span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .multi-value__remove { display:grid; width:1.8rem; flex:0 0 1.8rem; padding:0; color:var(--multi-value-color); background:transparent; border:0; border-left:1px solid color-mix(in srgb,var(--multi-value-color) 30%,var(--border-color)); place-items:center; }
    .multi-value__remove:hover { color:var(--danger); background:var(--danger-soft); }
    .multi-value__remove:focus-visible { z-index:1; outline:var(--focus-ring); outline-offset:-2px; }
  `],
})
export class MultiselectValueComponent {
  readonly label = input.required<string>();
  readonly icon = input('');
  readonly color = input('');
  readonly removed = output<void>();
}
