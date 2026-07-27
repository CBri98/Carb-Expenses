import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { apiErrorMessage } from '../../core/services/api-error';
import { SettingsStore } from '../../core/services/settings.store';
import type { AccentColor, ThemeMode } from '../../shared/models/settings.models';

@Component({
  selector: 'app-appearance-settings',
  standalone: true,
  template: `
    <article class="card settings-card">
      <div class="settings-card__header"><h2 class="h5 mb-1">Tema</h2><p class="small text-body-secondary mb-0">La scelta viene applicata subito e sincronizzata con il tuo account.</p></div>
      <div class="settings-card__body">
        @if (error()) { <div class="alert alert-danger" role="alert">{{ error() }}</div> }
        <div class="choice-grid" role="radiogroup" aria-label="Tema applicazione">
          @for (option of themes; track option.value) {
            <button type="button" class="choice-button" [class.active]="store.appearance().themeMode === option.value" [attr.aria-pressed]="store.appearance().themeMode === option.value" [disabled]="busy()" (click)="selectTheme(option.value)"><i class="bi fs-4 d-block mb-2" [class]="option.icon" aria-hidden="true"></i><strong>{{ option.label }}</strong><span class="small text-body-secondary d-block">{{ option.help }}</span></button>
          }
        </div>
      </div>
    </article>
    <article class="card settings-card">
      <div class="settings-card__header"><h2 class="h5 mb-1">Colore principale</h2><p class="small text-body-secondary mb-0">Preset controllati con contrasto verificabile; non vengono accettati colori arbitrari.</p></div>
      <div class="settings-card__body"><div class="choice-grid" role="radiogroup" aria-label="Colore principale">
        @for (option of accents; track option.value) {
          <button type="button" class="choice-button" [class.active]="store.appearance().accentColor === option.value" [attr.aria-pressed]="store.appearance().accentColor === option.value" [disabled]="busy()" (click)="selectAccent(option.value)"><span class="accent-dot" [style.background-color]="option.color" aria-hidden="true"></span><strong>{{ option.label }}</strong></button>
        }
      </div></div>
    </article>
  `,
  styleUrl: './settings.scss',
})
export class AppearanceSettingsComponent {
  readonly store = inject(SettingsStore);
  private readonly destroyRef = inject(DestroyRef);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly themes: ReadonlyArray<{ value: ThemeMode; label: string; help: string; icon: string }> = [
    { value: 'LIGHT', label: 'Chiaro', help: 'Sempre luminoso', icon: 'bi-sun' },
    { value: 'DARK', label: 'Scuro', help: 'Sempre scuro', icon: 'bi-moon-stars' },
    { value: 'SYSTEM', label: 'Sistema', help: 'Segue il dispositivo', icon: 'bi-circle-half' },
  ];
  readonly accents: ReadonlyArray<{ value: AccentColor; label: string; color: string }> = [
    { value: 'INDIGO', label: 'Indaco', color: '#7C83D6' },
    { value: 'LAVENDER', label: 'Lavanda', color: '#9B8FD9' },
    { value: 'SKY', label: 'Cielo', color: '#70AFCB' },
    { value: 'MINT', label: 'Menta', color: '#72B5A4' },
    { value: 'CORAL', label: 'Corallo', color: '#D98978' },
    { value: 'ROSE', label: 'Rosa', color: '#C98191' },
  ];

  constructor() { this.store.ensureLoaded(); }

  selectTheme(themeMode: ThemeMode): void { this.persist({ themeMode }); }
  selectAccent(accentColor: AccentColor): void { this.persist({ accentColor }); }

  private persist(request: { themeMode?: ThemeMode; accentColor?: AccentColor }): void {
    this.busy.set(true); this.error.set(null);
    this.store.updateAppearance(request).pipe(finalize(() => this.busy.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      error: (error: unknown) => this.error.set(apiErrorMessage(error)),
    });
  }
}
