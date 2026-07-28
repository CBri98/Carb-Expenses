import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface AppBreadcrumbItem {
  label: string;
  link?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  template: `
    <nav aria-label="Percorso di navigazione">
      <ol class="breadcrumb mb-3">
        @for (item of visibleItems(); track item.label; let last = $last) {
          <li class="breadcrumb-item" [class.active]="last" [attr.aria-current]="last ? 'page' : null">
            @if (!last && item.link) {
              <a [routerLink]="item.link">{{ item.label }}</a>
            } @else {
              <span>{{ item.label }}</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumb { flex-wrap: wrap; }
  `],
})
export class AppBreadcrumbComponent {
  readonly items = input.required<readonly AppBreadcrumbItem[]>();
  readonly visibleItems = computed(() => this.items().filter((item) => !SECTION_LABELS.has(item.label)));
}

const SECTION_LABELS = new Set(['Gestione', 'Analisi', 'Area personale']);
