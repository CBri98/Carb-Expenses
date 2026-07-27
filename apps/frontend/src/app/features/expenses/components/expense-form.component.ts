import { Component, DestroyRef, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  NgLabelTemplateDirective,
  NgOptionTemplateDirective,
  NgSelectComponent,
} from '@ng-select/ng-select';

import { CategoryService } from '../../../core/services/category.service';
import { LabelService } from '../../../core/services/label.service';
import { SettingsStore } from '../../../core/services/settings.store';
import { apiErrorMessage } from '../../../core/services/api-error';
import type {
  CreateExpenseRequest,
  ExpenseDetail,
  ExpenseFormSubmission,
} from '../../../shared/models/expense.models';
import { EXPENSE_STATUSES, PAYMENT_METHODS } from '../../../shared/models/expense.models';
import type { ExpenseReminder, ReminderDraft } from '../../../shared/models/notification.models';
import { isFutureLocalDate, normalizeAmount, todayLocalDate } from '../../../shared/utilities/expense-format';
import { ExpenseReminderFormComponent } from './expense-reminder-form.component';

@Component({
  selector: 'app-expense-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgSelectComponent,
    NgOptionTemplateDirective,
    NgLabelTemplateDirective,
    ExpenseReminderFormComponent,
  ],
  templateUrl: './expense-form.component.html',
  styleUrl: './expense-form.component.scss',
})
export class ExpenseFormComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly labelService = inject(LabelService);
  private readonly destroyRef = inject(DestroyRef);
  readonly settings = inject(SettingsStore);
  private statusIsManual = false;

  readonly expense = input<ExpenseDetail | null>(null);
  readonly existingReminders = input<readonly ExpenseReminder[]>([]);
  readonly initialDate = input<string | null>(null);
  readonly initialTime = input<string | null>(null);
  readonly compact = input(false);
  readonly submitting = input(false);
  readonly submitLabel = input('Salva spesa');
  readonly submitted = output<ExpenseFormSubmission>();
  readonly cancelled = output<void>();

  readonly categories = this.categoryService.categories;
  readonly labels = this.labelService.labels;
  readonly catalogLoading = signal(true);
  readonly catalogError = signal<string | null>(null);
  readonly advancedOpen = signal(false);
  readonly reminderDrafts = signal<ReminderDraft[]>([]);
  readonly remindersValid = signal(true);
  readonly reminderResetVersion = signal(0);
  readonly futureDate = signal(false);
  readonly selectedCategoryId = signal<string | null>(null);
  readonly labelCompatibilityNotice = signal<string | null>(null);
  readonly statuses = EXPENSE_STATUSES;
  readonly paymentMethods = PAYMENT_METHODS;
  readonly availableCategories = computed(() => {
    const currentId = this.expense()?.category.id;
    return this.categories().filter((category) => category.isActive || category.id === currentId);
  });
  readonly availableLabels = computed(() => {
    const currentIds = new Set(this.expense()?.labels.map((label) => label.id) ?? []);
    const categoryId = this.selectedCategoryId();
    return this.labels().filter(
      (label) =>
        (label.isActive || currentIds.has(label.id)) &&
        (label.categoryId === null || label.categoryId === categoryId),
    );
  });

  readonly form = this.formBuilder.nonNullable.group({
    description: ['', [Validators.required, Validators.maxLength(150)]],
    amount: [
      '',
      [
        Validators.required,
        Validators.pattern(/^(?!0+(?:[.,]0{1,2})?$)(?:0|[1-9]\d{0,9})(?:[.,]\d{1,2})?$/),
      ],
    ],
    expenseDate: [todayLocalDate(), [Validators.required, Validators.pattern(/^\d{4}-\d{2}-\d{2}$/)]],
    expenseTime: ['', [Validators.pattern(/^(?:[01]\d|2[0-3]):[0-5]\d$/)]],
    categoryId: this.formBuilder.control<string | null>(null, Validators.required),
    labelIds: this.formBuilder.nonNullable.control<string[]>([]),
    paymentMethod: this.formBuilder.nonNullable.control<CreateExpenseRequest['paymentMethod']>(
      'DEBIT_CARD',
      Validators.required,
    ),
    merchant: ['', [Validators.maxLength(150)]],
    notes: ['', [Validators.maxLength(5000)]],
    status: this.formBuilder.nonNullable.control<CreateExpenseRequest['status']>(
      'COMPLETED',
      Validators.required,
    ),
  });

  constructor() {
    this.settings.ensureLoaded();
    this.categoryService
      .load({ sortBy: 'sortOrder', sortDirection: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => this.catalogError.set(apiErrorMessage(error)),
      });
    this.labelService
      .load({ sortBy: 'sortOrder', sortDirection: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.catalogLoading.set(false),
        error: (error: unknown) => {
          this.catalogLoading.set(false);
          this.catalogError.set(apiErrorMessage(error));
        },
      });
    this.form.controls.expenseDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.handleDate(value));
    this.form.controls.categoryId.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.handleCategory(value));
    effect(() => {
      this.initialDate();
      this.initialTime();
      this.applyExpense(this.expense());
    });
    effect(() => {
      if (this.settings.loaded() && !this.expense() && this.form.pristine) this.resetForCreate();
    });
  }

  submit(): void {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    if (!value.categoryId || !this.remindersValid()) return;
    this.submitted.emit({
      expense: {
        description: value.description.trim(),
        amount: normalizeAmount(value.amount),
        expenseDate: value.expenseDate,
        expenseTime: value.expenseTime || null,
        categoryId: value.categoryId,
        labelIds: value.labelIds,
        paymentMethod: value.paymentMethod,
        merchant: value.merchant.trim() || null,
        notes: value.notes.trim() || null,
        status: value.status,
      },
      reminders: value.status === 'PLANNED' ? this.reminderDrafts() : [],
    });
  }

  statusChangedByUser(): void {
    this.statusIsManual = true;
  }

  toggleLabel(id: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.form.controls.labelIds.value;
    this.form.controls.labelIds.setValue(
      checked ? [...current, id] : current.filter((currentId) => currentId !== id),
    );
  }

  hasLabel(id: string): boolean {
    return this.form.controls.labelIds.value.includes(id);
  }

  resetForCreate(): void {
    this.statusIsManual = false;
    this.form.reset({
      description: '',
      amount: '',
      expenseDate: this.initialDate() || todayLocalDate(),
      expenseTime: this.initialTime() || '',
      categoryId: null,
      labelIds: [],
      paymentMethod: this.settings.experience().defaultPaymentMethod ?? 'DEBIT_CARD',
      merchant: '',
      notes: '',
      status: this.settings.experience().defaultExpenseStatus,
    });
    this.selectedCategoryId.set(null);
    this.labelCompatibilityNotice.set(null);
    this.advancedOpen.set(false);
    this.reminderDrafts.set([]);
    this.reminderResetVersion.update((value) => value + 1);
    this.remindersValid.set(true);
    this.handleDate(this.form.controls.expenseDate.value);
  }

  private applyExpense(expense: ExpenseDetail | null): void {
    if (!expense) {
      this.resetForCreate();
      return;
    }
    this.statusIsManual = true;
    this.form.reset(
      {
        description: expense.description,
        amount: expense.amount.replace('.', ','),
        expenseDate: expense.expenseDate,
        expenseTime: expense.expenseTime ?? '',
        categoryId: expense.category.id,
        labelIds: expense.labels.map((label) => label.id),
        paymentMethod: expense.paymentMethod,
        merchant: expense.merchant ?? '',
        notes: expense.notes ?? '',
        status: expense.status,
      },
      { emitEvent: false },
    );
    this.selectedCategoryId.set(expense.category.id);
    this.labelCompatibilityNotice.set(null);
    this.handleDate(expense.expenseDate);
    this.advancedOpen.set(true);
  }

  private handleDate(value: string): void {
    const future = isFutureLocalDate(value);
    this.futureDate.set(future);
    if (future && !this.statusIsManual) this.form.controls.status.setValue('PLANNED');
  }

  private handleCategory(categoryId: string | null): void {
    this.selectedCategoryId.set(categoryId);
    const selected = this.form.controls.labelIds.value;
    const compatible = selected.filter((id) => {
      const label = this.labels().find((item) => item.id === id);
      return !label || label.categoryId === null || label.categoryId === categoryId;
    });
    if (compatible.length === selected.length) {
      this.labelCompatibilityNotice.set(null);
      return;
    }
    this.form.controls.labelIds.setValue(compatible);
    const removed = selected.length - compatible.length;
    this.labelCompatibilityNotice.set(
      removed === 1
        ? 'È stata rimossa un’etichetta non compatibile con la nuova categoria.'
        : `Sono state rimosse ${removed} etichette non compatibili con la nuova categoria.`,
    );
  }
}
