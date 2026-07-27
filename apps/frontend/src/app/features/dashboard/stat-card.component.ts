import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <article class="stat-card h-100" [class.stat-card--interactive]="interactive()" [attr.role]="interactive() ? 'link' : null" [attr.tabindex]="interactive() ? 0 : null" (click)="activate()" (keydown.enter)="activate($event)" (keydown.space)="activate($event)">
      <div class="stat-card__icon"><i class="bi" [class]="icon()" aria-hidden="true"></i></div>
      <div class="min-w-0">
        <p class="stat-card__title">{{ title() }}</p>
        <p class="stat-card__value">{{ value() }}</p>
        @if (detail()) { <p class="stat-card__detail">{{ detail() }}</p> }
        @if (secondaryDetail()) { <p class="stat-card__detail stat-card__detail--secondary">{{ secondaryDetail() }}</p> }
        @if (badgeLabel()) {
          <span class="stat-card__badge" [style.--stat-card-badge-color]="badgeColor()" [attr.title]="badgeLabel()">
            @if (badgeIcon()) { <i class="bi" [class]="badgeIcon()" aria-hidden="true"></i> }
            {{ badgeLabel() }}
          </span>
        }
      </div>
    </article>
  `,
  styles: [`
    .stat-card { position:relative; display:flex; gap:1rem; padding:1.15rem; background:var(--surface); border:1px solid var(--border-color); border-radius:.9rem; box-shadow:var(--shadow-sm); }
    .stat-card:has(.stat-card__badge) .stat-card__title { padding-right:min(45%,10.5rem); }
    .stat-card__icon { display:grid; flex:0 0 2.5rem; width:2.5rem; height:2.5rem; color:var(--primary-strong); background:var(--primary-soft); border-radius:.7rem; place-items:center; }
    .stat-card__title { margin:0 0 .2rem; color:var(--text-secondary); font-size:.78rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
    .stat-card__value { margin:0; overflow-wrap:anywhere; color:var(--bs-body-color); font-size:1.35rem; font-weight:760; line-height:1.25; }
    .stat-card__detail { margin:.3rem 0 0; color:var(--text-secondary); font-size:.82rem; }
    .stat-card__detail--secondary { margin-top:.08rem; }
    .stat-card__badge { position:absolute; top:.75rem; right:.85rem; display:inline-flex; gap:.35rem; align-items:center; max-width:min(42%,9.5rem); padding:.2rem .5rem; overflow:hidden; color:var(--bs-body-color); font-size:.75rem; font-weight:650; text-overflow:ellipsis; white-space:nowrap; background:color-mix(in srgb, var(--stat-card-badge-color, var(--primary)) 14%, var(--surface)); border:1px solid color-mix(in srgb, var(--stat-card-badge-color, var(--primary)) 34%, var(--border-color)); border-radius:999px; }
    .stat-card__badge i { color:var(--stat-card-badge-color, var(--primary-strong)); }
    .min-w-0 { min-width:0; }
    .stat-card--interactive { cursor:pointer; transition:transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease; }
    .stat-card--interactive:hover { border-color:var(--primary); box-shadow:var(--shadow-md); transform:translateY(-2px); }
    .stat-card--interactive:focus-visible { outline:3px solid rgb(var(--primary-rgb) / 35%); outline-offset:2px; }
  `],
})
export class StatCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string>();
  readonly icon = input('bi-wallet2');
  readonly detail = input('');
  readonly secondaryDetail = input('');
  readonly badgeLabel = input('');
  readonly badgeIcon = input('');
  readonly badgeColor = input('');
  readonly interactive = input(false);
  readonly activated = output<void>();

  activate(event?: Event): void {
    if (!this.interactive()) return;
    event?.preventDefault();
    this.activated.emit();
  }
}
