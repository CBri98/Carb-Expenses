import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';

import { apiErrorMessage } from '../../core/services/api-error';
import { SettingsStore } from '../../core/services/settings.store';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ConfirmDialogComponent],
  template: `
    <section aria-labelledby="settings-title">
      <nav aria-label="breadcrumb"><ol class="breadcrumb mb-3"><li class="breadcrumb-item active">Impostazioni</li></ol></nav>
      <div class="settings-heading mb-4">
        <div><p class="eyebrow mb-1">Preferenze personali</p><h1 id="settings-title" class="h2 mb-1">Impostazioni</h1><p class="text-body-secondary mb-0">Configura account e comportamento dell’applicazione.</p></div>
        <button class="btn btn-outline-danger" type="button" (click)="resetOpen.set(true)"><i class="bi bi-arrow-counterclockwise me-2"></i>Ripristina preferenze</button>
      </div>
      @if (notice(); as message) { <div class="alert" [class.alert-success]="message.tone === 'success'" [class.alert-danger]="message.tone === 'danger'" role="status">{{ message.text }}</div> }
      <label class="form-label d-md-none" for="settings-section">Sezione</label>
      <select id="settings-section" class="form-select d-md-none mb-3" [value]="router.url" (change)="navigateMobile($event)">
        @for (item of navigation; track item.path) { <option [value]="item.path">{{ item.label }}</option> }
      </select>
      <div class="settings-layout">
        <nav class="settings-nav d-none d-md-flex" aria-label="Sezioni impostazioni">
          @for (item of navigation; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" ariaCurrentWhenActive="page"><i class="bi" [class]="item.icon" aria-hidden="true"></i><span>{{ item.label }}</span></a>
          }
        </nav>
        <div class="settings-content"><router-outlet /></div>
      </div>
    </section>
    <app-confirm-dialog [open]="resetOpen()" title="Ripristina preferenze" message="Tema, esperienza, icone e promemoria torneranno ai valori iniziali. Account e dati finanziari non verranno modificati." confirmLabel="Ripristina" [busy]="resetting()" (confirmed)="reset()" (cancelled)="resetOpen.set(false)" />
  `,
  styleUrl: './settings.scss',
})
export class SettingsPageComponent {
  readonly store = inject(SettingsStore);
  readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly resetOpen = signal(false);
  readonly resetting = signal(false);
  readonly notice = signal<{ tone: 'success' | 'danger'; text: string } | null>(null);
  readonly navigation = [
    { path: '/settings/account', label: 'Account', icon: 'bi-person-circle' },
    { path: '/settings/appearance', label: 'Aspetto', icon: 'bi-palette' },
    { path: '/settings/experience', label: 'Esperienza', icon: 'bi-sliders' },
    { path: '/settings/icons', label: 'Icone', icon: 'bi-grid-3x3-gap' },
    { path: '/settings/notifications', label: 'Promemoria', icon: 'bi-bell' },
  ] as const;

  constructor() {
    this.store.ensureLoaded();
  }

  navigateMobile(event: Event): void {
    void this.router.navigateByUrl((event.target as HTMLSelectElement).value);
  }

  reset(): void {
    this.resetting.set(true);
    this.store.reset().pipe(
      finalize(() => this.resetting.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.resetOpen.set(false);
        this.notice.set({ tone: 'success', text: 'Preferenze iniziali ripristinate.' });
      },
      error: (error: unknown) => this.notice.set({ tone: 'danger', text: apiErrorMessage(error) }),
    });
  }
}
