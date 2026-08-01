import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  NgLabelTemplateDirective,
  NgOptionTemplateDirective,
  NgSelectComponent,
} from '@ng-select/ng-select';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  switchMap,
} from 'rxjs';

import { apiErrorMessage } from '../../core/services/api-error';
import { CategoryService } from '../../core/services/category.service';
import { LabelService } from '../../core/services/label.service';
import { RecurrenceService } from '../../core/services/recurrence.service';
import { SettingsStore } from '../../core/services/settings.store';
import type {
  CreateRecurrenceRequest,
  RecurrenceFormSubmission,
  RecurrencePreviewRequest,
  RecurrenceRule,
  RecurrenceUpdateScope,
} from '../../shared/models/recurrence.models';
import {
  RECURRENCE_FREQUENCIES,
  RECURRENCE_REMINDER_OPTIONS,
} from '../../shared/models/recurrence.models';
import { PAYMENT_METHODS } from '../../shared/models/expense.models';
import {
  normalizeAmount,
  todayLocalDate,
} from '../../shared/utilities/expense-format';
import { recurrenceFrequencyLabel } from '../../shared/utilities/recurrence-format';
import { MultiselectValueComponent } from '../../shared/components/multiselect-value.component';

@Component({
  selector: 'app-recurrence-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgSelectComponent,
    NgOptionTemplateDirective,
    NgLabelTemplateDirective,
    MultiselectValueComponent,
  ],
  templateUrl: './recurrence-form.component.html',
  styleUrl: './recurrence-form.component.scss',
})
export class RecurrenceFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoryService);
  private readonly labelsService = inject(LabelService);
  private readonly recurrenceService = inject(RecurrenceService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly settings = inject(SettingsStore);

  readonly recurrence = input<RecurrenceRule | null>(null);
  readonly submitting = input(false);
  readonly submitted = output<RecurrenceFormSubmission>();
  readonly cancelled = output<void>();
  readonly categories = this.categoriesService.categories;
  readonly labels = this.labelsService.labels;
  readonly previewDates = signal<string[]>([]);
  readonly previewLoading = signal(false);
  readonly previewError = signal<string | null>(null);
  readonly catalogLoading = signal(true);
  readonly catalogError = signal<string | null>(null);
  readonly frequencies = RECURRENCE_FREQUENCIES;
  readonly paymentMethods = PAYMENT_METHODS;
  readonly reminderOptions = RECURRENCE_REMINDER_OPTIONS;

  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.maxLength(150)]],
      amount: [
        '',
        [
          Validators.required,
          Validators.pattern(/^(?!0+(?:[.,]0{1,2})?$)(?:0|[1-9]\d{0,9})(?:[.,]\d{1,2})?$/),
        ],
      ],
      categoryId: this.fb.control<string | null>(null, Validators.required),
      labelIds: this.fb.nonNullable.control<string[]>([]),
      merchant: ['', [Validators.maxLength(150)]],
      paymentMethod: this.fb.nonNullable.control<CreateRecurrenceRequest['paymentMethod']>(
        'DIRECT_DEBIT',
        Validators.required,
      ),
      notes: ['', [Validators.maxLength(5000)]],
      frequency: this.fb.nonNullable.control<CreateRecurrenceRequest['frequency']>(
        'MONTHLY',
        Validators.required,
      ),
      interval: [1, [Validators.required, Validators.min(1), Validators.max(365)]],
      startDate: [todayLocalDate(), [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]],
      endDate: ['', [Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]],
      maxOccurrences: this.fb.control<number | null>(null, [Validators.min(1), Validators.max(10_000)]),
      expenseTime: ['', [Validators.pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/)]],
      generateDaysAhead: [30, [Validators.required, Validators.min(1), Validators.max(365)]],
      reminderTypes: this.fb.nonNullable.control<CreateRecurrenceRequest['reminderTemplates'][number]['type'][]>([]),
      reminderTime: ['09:00', [Validators.pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/)]],
      updateScope: this.fb.nonNullable.control<RecurrenceUpdateScope>('RULE_ONLY'),
    },
    { validators: dateRangeValidator },
  );

  constructor() {
    this.settings.ensureLoaded();
    this.categoriesService
      .load({ sortBy: 'sortOrder', sortDirection: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: (error: unknown) => this.catalogError.set(apiErrorMessage(error)) });
    this.labelsService
      .load({ sortBy: 'sortOrder', sortDirection: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.catalogLoading.set(false),
        error: (error: unknown) => {
          this.catalogLoading.set(false);
          this.catalogError.set(apiErrorMessage(error));
        },
      });

    this.form.valueChanges
      .pipe(
        debounceTime(350),
        map(() => this.previewPayload()),
        distinctUntilChanged((left, right) => JSON.stringify(left) === JSON.stringify(right)),
        switchMap((payload) => {
          if (!payload) {
            this.previewDates.set([]);
            return of(null);
          }
          this.previewLoading.set(true);
          this.previewError.set(null);
          return this.recurrenceService.preview(payload).pipe(
            catchError((error: unknown) => {
              this.previewError.set(apiErrorMessage(error));
              return of(null);
            }),
            finalize(() => this.previewLoading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((response) => this.previewDates.set(response?.dates ?? []));

    effect(() => this.apply(this.recurrence()));
  }

  frequencySummary(): string {
    const value = this.form.getRawValue();
    return recurrenceFrequencyLabel(value.frequency, value.interval || 1);
  }

  toggleReminder(type: CreateRecurrenceRequest['reminderTemplates'][number]['type'], checked: boolean): void {
    const current = this.form.controls.reminderTypes.value;
    this.form.controls.reminderTypes.setValue(
      checked ? [...new Set([...current, type])] : current.filter((item) => item !== type),
    );
  }

  toggleReminderFromEvent(
    type: CreateRecurrenceRequest['reminderTemplates'][number]['type'],
    event: Event,
  ): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) this.toggleReminder(type, target.checked);
  }

  hasReminder(type: CreateRecurrenceRequest['reminderTemplates'][number]['type']): boolean {
    return this.form.controls.reminderTypes.value.includes(type);
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (!value.categoryId) return;
    this.submitted.emit({
      payload: {
        name: value.name.trim(),
        description: value.name.trim(),
        amount: normalizeAmount(value.amount),
        categoryId: value.categoryId,
        labelIds: value.labelIds,
        merchant: value.merchant.trim() || null,
        paymentMethod: value.paymentMethod,
        notes: value.notes.trim() || null,
        frequency: value.frequency,
        interval: value.interval,
        startDate: value.startDate,
        endDate: value.endDate || null,
        maxOccurrences: value.maxOccurrences,
        expenseTime: value.expenseTime || null,
        generateDaysAhead: value.generateDaysAhead,
        reminderTemplates: value.reminderTypes.map((type) => ({
          type,
          reminderTime: value.reminderTime || null,
        })),
      },
      updateScope: value.updateScope,
    });
  }

  private previewPayload(): RecurrencePreviewRequest | null {
    const controls = this.form.controls;
    if (
      controls.frequency.invalid ||
      controls.interval.invalid ||
      controls.startDate.invalid ||
      controls.endDate.invalid ||
      controls.maxOccurrences.invalid ||
      this.form.hasError('dateRange')
    ) {
      return null;
    }
    const value = this.form.getRawValue();
    return {
      frequency: value.frequency,
      interval: value.interval,
      startDate: value.startDate,
      endDate: value.endDate || null,
      maxOccurrences: value.maxOccurrences,
      limit: 6,
    };
  }

  private apply(recurrence: RecurrenceRule | null): void {
    if (!recurrence) {
      this.form.controls.startDate.enable({ emitEvent: false });
      this.form.reset({
        name: '',
        amount: '',
        categoryId: null,
        labelIds: [],
        merchant: '',
        paymentMethod: this.settings.experience().defaultPaymentMethod ?? 'DIRECT_DEBIT',
        notes: '',
        frequency: 'MONTHLY',
        interval: 1,
        startDate: todayLocalDate(),
        endDate: '',
        maxOccurrences: null,
        expenseTime: '',
        generateDaysAhead: 30,
        reminderTypes: [...this.settings.notifications().defaultReminderTypes],
        reminderTime: this.settings.notifications().defaultReminderTime,
        updateScope: 'RULE_ONLY',
      });
      return;
    }
    this.form.reset({
      name: recurrence.name,
      amount: recurrence.amount.replace('.', ','),
      categoryId: recurrence.category.id,
      labelIds: recurrence.labels.map((label) => label.id),
      merchant: recurrence.merchant ?? '',
      paymentMethod: recurrence.paymentMethod,
      notes: recurrence.notes ?? '',
      frequency: recurrence.frequency,
      interval: recurrence.interval,
      startDate: recurrence.startDate,
      endDate: recurrence.endDate ?? '',
      maxOccurrences: recurrence.maxOccurrences,
      expenseTime: recurrence.expenseTime ?? '',
      generateDaysAhead: recurrence.generateDaysAhead,
      reminderTypes: recurrence.reminderTemplates.map((template) => template.type),
      reminderTime: recurrence.reminderTemplates[0]?.reminderTime ?? '09:00',
      updateScope: 'RULE_ONLY',
    });
    if (recurrence.generatedCount > 0) {
      this.form.controls.startDate.disable({ emitEvent: false });
    } else {
      this.form.controls.startDate.enable({ emitEvent: false });
    }
  }
}

function dateRangeValidator(control: AbstractControl): ValidationErrors | null {
  const start = control.get('startDate')?.value;
  const end = control.get('endDate')?.value;
  return typeof start === 'string' && typeof end === 'string' && end && end < start
    ? { dateRange: true }
    : null;
}
