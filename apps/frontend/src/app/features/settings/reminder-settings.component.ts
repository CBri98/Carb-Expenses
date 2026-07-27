import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';

import { apiErrorMessage } from '../../core/services/api-error';
import { SettingsStore } from '../../core/services/settings.store';
import { REMINDER_PRESETS, type ReminderPresetOption } from '../../shared/models/notification.models';
import type { ReminderPreset } from '../../shared/models/settings.models';

@Component({
  selector: 'app-reminder-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()">
      @if (notice(); as message) { <div class="alert" [class.alert-success]="message.tone === 'success'" [class.alert-danger]="message.tone === 'danger'" role="status">{{ message.text }}</div> }
      <article class="card settings-card"><div class="settings-card__header"><h2 class="h5 mb-1">Valori predefiniti promemoria</h2><p class="small text-body-secondary mb-0">Saranno proposti soltanto nelle nuove spese pianificate; i promemoria esistenti non cambiano.</p></div><div class="settings-card__body">
        <div class="row g-3"><div class="col-12 col-md-5"><label class="form-label" for="default-reminder-time">Orario predefinito</label><input id="default-reminder-time" class="form-control" type="time" formControlName="defaultReminderTime" /></div><div class="col-12"><fieldset><legend class="form-label">Preset suggeriti</legend><div class="row g-2">@for (preset of presets; track preset.type) { <div class="col-12 col-sm-6"><div class="form-check"><input class="form-check-input" type="checkbox" [id]="'preset-' + preset.type" [checked]="selected(preset.type)" (change)="toggle(preset.type, $event)" /><label class="form-check-label" [for]="'preset-' + preset.type"><strong>{{ preset.label }}</strong><span class="small text-body-secondary d-block">{{ preset.help }}</span></label></div></div> }</div></fieldset></div>
          <div class="col-12"><div class="form-check form-switch"><input id="due-today-enabled" class="form-check-input" type="checkbox" formControlName="dueTodayEnabled" /><label class="form-check-label" for="due-today-enabled">Genera notifiche automatiche per le spese previste oggi</label></div></div>
          <div class="col-12"><div class="form-check form-switch"><input id="overdue-enabled" class="form-check-input" type="checkbox" formControlName="overdueEnabled" /><label class="form-check-label" for="overdue-enabled">Genera notifiche automatiche per le spese pianificate scadute</label></div></div>
        </div><div class="settings-actions mt-3"><button class="btn btn-primary" type="submit" [disabled]="saving() || form.invalid || !form.dirty">@if (saving()) { <span class="spinner-border spinner-border-sm me-2"></span> }Salva promemoria</button></div>
      </div></article>
      <div class="alert alert-info mt-3 mb-0"><i class="bi bi-info-circle me-2"></i>Questa sezione configura i valori suggeriti. La gestione globale dei promemoria non fa parte di questa fase.</div>
    </form>
  `,
  styleUrl: './settings.scss',
})
export class ReminderSettingsComponent {
  private readonly store = inject(SettingsStore);
  private readonly builder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  readonly presets: readonly ReminderPresetOption[] = REMINDER_PRESETS;
  readonly saving = signal(false);
  readonly notice = signal<{ tone: 'success' | 'danger'; text: string } | null>(null);
  readonly form = this.builder.nonNullable.group({
    defaultReminderTime: ['09:00', [Validators.required, Validators.pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/)]],
    defaultReminderTypes: this.builder.nonNullable.control<ReminderPreset[]>([]),
    dueTodayEnabled: true,
    overdueEnabled: true,
  });

  constructor() {
    this.store.ensureLoaded();
    effect(() => this.form.reset(this.store.notifications()));
  }

  selected(type: ReminderPreset): boolean { return this.form.controls.defaultReminderTypes.value.includes(type); }
  toggle(type: ReminderPreset, event: Event): void {
    const selected = new Set(this.form.controls.defaultReminderTypes.value);
    if ((event.target as HTMLInputElement).checked) selected.add(type); else selected.delete(type);
    this.form.controls.defaultReminderTypes.setValue([...selected]);
    this.form.controls.defaultReminderTypes.markAsDirty();
  }
  save(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.store.updateNotifications(this.form.getRawValue()).pipe(finalize(() => this.saving.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.form.markAsPristine(); this.notice.set({ tone: 'success', text: 'Preferenze promemoria aggiornate.' }); },
      error: (error: unknown) => this.notice.set({ tone: 'danger', text: apiErrorMessage(error) }),
    });
  }
}
