import { Component, input } from '@angular/core';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <article class="stat-card h-100">
      <div class="stat-card__icon"><i class="bi" [class]="icon()" aria-hidden="true"></i></div>
      <div class="min-w-0">
        <p class="stat-card__title">{{ title() }}</p>
        <p class="stat-card__value">{{ value() }}</p>
        @if (detail()) { <p class="stat-card__detail">{{ detail() }}</p> }
      </div>
    </article>
  `,
  styles: [`
    .stat-card { display:flex; gap:1rem; padding:1.15rem; background:var(--surface); border:1px solid #d9ddec; border-radius:.9rem; box-shadow:0 .2rem .8rem rgb(59 65 104 / 6%); }
    .stat-card__icon { display:grid; flex:0 0 2.5rem; width:2.5rem; height:2.5rem; color:var(--primary-strong); background:var(--primary-soft); border-radius:.7rem; place-items:center; }
    .stat-card__title { margin:0 0 .2rem; color:var(--text-secondary); font-size:.78rem; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
    .stat-card__value { margin:0; overflow-wrap:anywhere; color:var(--bs-body-color); font-size:1.35rem; font-weight:760; line-height:1.25; }
    .stat-card__detail { margin:.3rem 0 0; color:var(--text-secondary); font-size:.82rem; }
    .min-w-0 { min-width:0; }
  `],
})
export class StatCardComponent {
  readonly title = input.required<string>();
  readonly value = input.required<string>();
  readonly icon = input('bi-wallet2');
  readonly detail = input('');
}
