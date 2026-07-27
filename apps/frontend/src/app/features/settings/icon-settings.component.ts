import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { apiErrorMessage } from '../../core/services/api-error';
import { SettingsStore } from '../../core/services/settings.store';
import { IconPickerComponent } from '../../shared/components/icon-picker.component';
import { DEFAULT_CATEGORY_ICONS, DEFAULT_LABEL_ICONS, ICON_KEYS } from '../../shared/models/icon-catalog';

@Component({
  selector: 'app-icon-settings',
  standalone: true,
  imports: [IconPickerComponent],
  template: `
    @if (notice(); as message) { <div class="alert" [class.alert-success]="message.tone === 'success'" [class.alert-danger]="message.tone === 'danger'" role="status">{{ message.text }}</div> }
    <article class="card settings-card"><div class="settings-card__header d-flex flex-wrap gap-2 align-items-center justify-content-between"><div><h2 class="h5 mb-1">Icone categorie</h2><p class="small text-body-secondary mb-0">{{ categoryIcons().length }} selezionate</p></div><div class="btn-group btn-group-sm"><button class="btn btn-outline-secondary" type="button" (click)="categoryIcons.set(allIcons)">Tutte</button><button class="btn btn-outline-secondary" type="button" (click)="categoryIcons.set([])">Nessuna</button><button class="btn btn-outline-secondary" type="button" (click)="categoryIcons.set(defaultCategoryIcons)">Predefinite</button></div></div><div class="settings-card__body"><app-icon-picker inputId="settings-category-icon-search" [multiple]="true" [availableIcons]="allIcons" [selectedIcons]="categoryIcons()" (selectionChange)="categoryIcons.set($event.slice())" /></div></article>
    <article class="card settings-card"><div class="settings-card__header d-flex flex-wrap gap-2 align-items-center justify-content-between"><div><h2 class="h5 mb-1">Icone etichette</h2><p class="small text-body-secondary mb-0">{{ labelIcons().length }} selezionate</p></div><div class="btn-group btn-group-sm"><button class="btn btn-outline-secondary" type="button" (click)="labelIcons.set(allIcons)">Tutte</button><button class="btn btn-outline-secondary" type="button" (click)="labelIcons.set([])">Nessuna</button><button class="btn btn-outline-secondary" type="button" (click)="labelIcons.set(defaultLabelIcons)">Predefinite</button></div></div><div class="settings-card__body"><app-icon-picker inputId="settings-label-icon-search" [multiple]="true" [availableIcons]="allIcons" [selectedIcons]="labelIcons()" (selectionChange)="labelIcons.set($event.slice())" /><div class="settings-actions mt-3"><button class="btn btn-primary" type="button" [disabled]="saving() || categoryIcons().length === 0 || labelIcons().length === 0" (click)="save()">@if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> }Salva icone</button></div>@if (categoryIcons().length === 0 || labelIcons().length === 0) { <div class="invalid-feedback d-block">Seleziona almeno un’icona per ciascun tipo.</div> }</div></article>
    <p class="small text-body-secondary mt-3"><i class="bi bi-info-circle me-1"></i>Nascondere un’icona non modifica i record esistenti: resterà visibile e selezionabile nel relativo form di modifica.</p>
  `,
  styleUrl: './settings.scss',
})
export class IconSettingsComponent {
  private readonly store = inject(SettingsStore);
  private readonly destroyRef = inject(DestroyRef);
  readonly allIcons = ICON_KEYS;
  readonly defaultCategoryIcons = DEFAULT_CATEGORY_ICONS;
  readonly defaultLabelIcons = DEFAULT_LABEL_ICONS;
  readonly categoryIcons = signal<string[]>([]);
  readonly labelIcons = signal<string[]>([]);
  readonly saving = signal(false);
  readonly notice = signal<{ tone: 'success' | 'danger'; text: string } | null>(null);

  constructor() {
    this.store.ensureLoaded();
    effect(() => {
      const icons = this.store.icons();
      this.categoryIcons.set([...icons.enabledCategoryIcons]);
      this.labelIcons.set([...icons.enabledLabelIcons]);
    });
  }

  save(): void {
    if (!this.categoryIcons().length || !this.labelIcons().length) return;
    this.saving.set(true);
    this.store.updateIcons({ enabledCategoryIcons: this.categoryIcons(), enabledLabelIcons: this.labelIcons() }).pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.notice.set({ tone: 'success', text: 'Cataloghi icone aggiornati.' }),
      error: (error: unknown) => this.notice.set({ tone: 'danger', text: apiErrorMessage(error) }),
    });
  }
}
