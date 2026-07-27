import { Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { ExpenseStatus } from '../../../shared/models/expense.models';
import {
  REMINDER_PRESETS,
  type ExpenseReminder,
  type ReminderDraft,
  type ReminderType,
} from '../../../shared/models/notification.models';
import {
  isoToRomeLocalInput,
  nowRomeLocalInput,
  romeLocalDateTimeToIso,
} from '../../../shared/utilities/notification-date';

@Component({
  selector: 'app-expense-reminder-form',
  standalone: true,
  imports: [FormsModule],
  template: `
    @if (status() === 'PLANNED') {
      <section class="reminder-form" aria-labelledby="reminder-form-title">
        <div class="d-flex align-items-center justify-content-between gap-3 mb-3">
          <div>
            <h3 class="h6 mb-1" id="reminder-form-title"><i class="bi bi-bell me-2" aria-hidden="true"></i>Promemoria</h3>
            <p class="small text-body-secondary mb-0">Scegli uno o più avvisi. I preset seguono la data della spesa.</p>
          </div>
          @if (loading()) { <span class="spinner-border spinner-border-sm" aria-label="Caricamento promemoria"></span> }
        </div>
        <div class="row g-2">
          @for (option of presets; track option.type) {
            <div class="col-12 col-md-6">
              <label class="reminder-option" [class.reminder-option--selected]="selected().has(option.type)">
                <input
                  class="form-check-input"
                  type="checkbox"
                  [checked]="selected().has(option.type)"
                  [disabled]="disabled()"
                  (change)="toggle(option.type, $event)"
                >
                <span><strong>{{ option.label }}</strong><small>{{ option.help }}</small></span>
              </label>
            </div>
          }
          <div class="col-12">
            <label class="reminder-option" [class.reminder-option--selected]="selected().has('CUSTOM')">
              <input
                class="form-check-input"
                type="checkbox"
                [checked]="selected().has('CUSTOM')"
                [disabled]="disabled()"
                (change)="toggle('CUSTOM', $event)"
              >
              <span><strong>Data e ora personalizzate</strong><small>Il promemoria non viene spostato automaticamente se cambia la spesa.</small></span>
            </label>
          </div>
          @if (selected().has('CUSTOM')) {
            <div class="col-12 col-md-7 mt-3">
              <label class="form-label" for="custom-reminder-date">Data e ora del promemoria</label>
              <input
                id="custom-reminder-date"
                class="form-control"
                type="datetime-local"
                [ngModel]="customLocal()"
                [disabled]="disabled()"
                [attr.max]="deadlineLocal()"
                [attr.min]="minimumLocal()"
                (ngModelChange)="customChanged($event)"
                aria-describedby="custom-reminder-help custom-reminder-error"
              >
              <div id="custom-reminder-help" class="form-text">Orario interpretato nel fuso Europe/Rome.</div>
              @if (customError(); as message) {
                <div id="custom-reminder-error" class="invalid-feedback d-block">{{ message }}</div>
              }
            </div>
          }
        </div>
      </section>
    }
  `,
  styles: [`
    .reminder-form { padding: 1rem; background: var(--surface-soft); border: 1px solid var(--border-color); border-radius: .8rem; }
    .reminder-option { display: flex; min-height: 4rem; gap: .75rem; align-items: flex-start; padding: .75rem; border: 1px solid var(--border-color); border-radius: .65rem; cursor: pointer; background: var(--surface); }
    .reminder-option--selected { border-color: var(--primary); background: var(--primary-soft); }
    .reminder-option span { display: grid; gap: .15rem; }
    .reminder-option small { color: var(--text-secondary); }
  `],
})
export class ExpenseReminderFormComponent {
  readonly status = input.required<ExpenseStatus>();
  readonly expenseDate = input.required<string>();
  readonly expenseTime = input<string>('');
  readonly reminders = input<readonly ExpenseReminder[]>([]);
  readonly defaultTypes = input<readonly Exclude<ReminderType, 'CUSTOM'>[]>([]);
  readonly defaultTime = input('09:00');
  readonly resetVersion = input(0);
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly draftsChanged = output<ReminderDraft[]>();
  readonly validityChanged = output<boolean>();

  readonly presets = REMINDER_PRESETS;
  readonly selected = signal<ReadonlySet<ReminderType>>(new Set());
  readonly customLocal = signal('');
  readonly minimumLocal = signal(nowRomeLocalInput());
  readonly deadlineLocal = computed(
    () => `${this.expenseDate()}T${this.expenseTime() || this.defaultTime()}`,
  );
  readonly customError = computed(() => {
    if (!this.selected().has('CUSTOM')) return null;
    const value = this.customLocal();
    if (!value) return 'Seleziona data e ora del promemoria.';
    if (value < this.minimumLocal()) return 'Il promemoria non può essere nel passato.';
    if (value > this.deadlineLocal()) return 'Il promemoria deve precedere la spesa.';
    return null;
  });

  constructor() {
    effect(() => {
      this.resetVersion();
      const active = this.reminders().filter((reminder) => reminder.isActive && !reminder.processedAt);
      const defaults = active.length === 0 && this.reminders().length === 0
        ? this.defaultTypes()
        : [];
      untracked(() => {
        this.selected.set(new Set(active.length ? active.map((reminder) => reminder.type) : defaults));
        const custom = active.find((reminder) => reminder.type === 'CUSTOM');
        this.customLocal.set(custom ? isoToRomeLocalInput(custom.scheduledAt) : '');
        this.emit();
      });
    });
  }

  toggle(type: ReminderType, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selected.update((current) => {
      const next = new Set(current);
      if (checked) next.add(type);
      else next.delete(type);
      return next;
    });
    this.emit();
  }

  customChanged(value: string): void {
    this.customLocal.set(value);
    this.emit();
  }

  private emit(): void {
    const drafts: ReminderDraft[] = [];
    for (const type of this.selected()) {
      if (type !== 'CUSTOM') {
        drafts.push({ type });
        continue;
      }
      const scheduledAt = romeLocalDateTimeToIso(this.customLocal());
      if (scheduledAt) drafts.push({ type, scheduledAt });
    }
    queueMicrotask(() => {
      this.draftsChanged.emit(drafts);
      this.validityChanged.emit(this.customError() === null);
    });
  }
}
