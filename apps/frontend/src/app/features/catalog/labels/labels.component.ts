import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  NgLabelTemplateDirective,
  NgOptionTemplateDirective,
  NgSelectComponent,
} from '@ng-select/ng-select';
import { debounceTime, finalize } from 'rxjs';

import { apiErrorMessage } from '../../../core/services/api-error';
import { CategoryService } from '../../../core/services/category.service';
import { LabelService } from '../../../core/services/label.service';
import {
  CategoryBadgeComponent,
  EmptyStateComponent,
  LabelBadgeComponent,
  LoadingSkeletonComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
} from '../../../shared/components/catalog-display.components';
import { ColorPickerComponent } from '../../../shared/components/color-picker.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { IconPickerComponent } from '../../../shared/components/icon-picker.component';
import { EscapeCloseDirective } from '../../../shared/directives/escape-close.directive';
import type {
  CreateLabelRequest,
  Label,
  LabelQueryParams,
  ReorderItem,
  UpdateLabelRequest,
} from '../../../shared/models/catalog.models';

interface Notice {
  type: 'success' | 'danger';
  text: string;
}

@Component({
  selector: 'app-labels',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgSelectComponent,
    NgOptionTemplateDirective,
    NgLabelTemplateDirective,
    PageHeaderComponent,
    CategoryBadgeComponent,
    LabelBadgeComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    ColorPickerComponent,
    IconPickerComponent,
    ConfirmDialogComponent,
    EscapeCloseDirective,
  ],
  templateUrl: './labels.component.html',
  styleUrl: '../catalog-page.scss',
})
export class LabelsComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly labelService = inject(LabelService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);

  readonly categories = this.categoryService.categories;
  readonly labels = this.labelService.labels;
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly editing = signal<Label | null>(null);
  readonly deleteTarget = signal<Label | null>(null);
  readonly notice = signal<Notice | null>(null);
  readonly activeOptions = [
    { value: 'all', label: 'Tutti', icon: 'bi-circle-half' },
    { value: 'true', label: 'Attive', icon: 'bi-check-circle' },
    { value: 'false', label: 'Disattivate', icon: 'bi-pause-circle' },
  ] as const;
  readonly canReorder = computed(() => {
    const filters = this.filters.getRawValue();
    return !filters.search.trim() && !filters.categoryId && filters.active === 'all';
  });

  readonly filters = this.formBuilder.nonNullable.group({
    search: [''],
    categoryId: this.formBuilder.control<string | null>(null),
    active: ['all'],
  });

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]],
    color: ['#F59E0B', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    icon: ['', [Validators.pattern(/^bi-[a-z0-9-]+$/)]],
    categoryId: this.formBuilder.control<string | null>(null),
    sortOrder: [0, [Validators.required, Validators.min(0)]],
    isActive: [true],
  });

  constructor() {
    this.filters.valueChanges
      .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadLabels());
    this.loadCategories();
    this.loadLabels();
  }

  openCreate(): void {
    const nextOrder = Math.max(0, ...this.labels().map((item) => item.sortOrder)) + 1;
    this.editing.set(null);
    this.form.reset({
      name: '',
      description: '',
      color: '#F59E0B',
      icon: '',
      categoryId: null,
      sortOrder: nextOrder,
      isActive: true,
    });
    this.formOpen.set(true);
  }

  openEdit(label: Label): void {
    this.editing.set(label);
    this.form.reset({
      name: label.name,
      description: label.description ?? '',
      color: label.color,
      icon: label.icon ?? '',
      categoryId: label.categoryId,
      sortOrder: label.sortOrder,
      isActive: label.isActive,
    });
    this.formOpen.set(true);
  }

  closeForm(): void {
    if (!this.saving()) this.formOpen.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const editing = this.editing();
    const payload: CreateLabelRequest = {
      name: value.name,
      description: value.description.trim() || null,
      color: value.color,
      icon: value.icon || null,
      categoryId: value.categoryId,
      sortOrder: value.sortOrder,
      isActive: value.isActive,
    };
    const request = editing
      ? this.labelService.update(editing.id, payload satisfies UpdateLabelRequest)
      : this.labelService.create(payload);

    this.saving.set(true);
    request
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.formOpen.set(false);
          this.showSuccess(
            editing ? 'Etichetta aggiornata correttamente.' : 'Etichetta creata correttamente.',
          );
          this.loadLabels(false);
        },
        error: (error: unknown) =>
          this.notice.set({ type: 'danger', text: apiErrorMessage(error) }),
      });
  }

  toggleStatus(label: Label): void {
    this.labelService
      .setStatus(label.id, !label.isActive)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showSuccess(`Etichetta ${label.isActive ? 'disattivata' : 'attivata'}.`);
          this.loadLabels(false);
        },
        error: (error: unknown) =>
          this.notice.set({ type: 'danger', text: apiErrorMessage(error) }),
      });
  }

  move(index: number, direction: -1 | 1): void {
    if (!this.canReorder()) return;
    const target = index + direction;
    const ordered = [...this.labels()];
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    const items: ReorderItem[] = ordered.map((label, itemIndex) => ({
      id: label.id,
      sortOrder: itemIndex + 1,
    }));
    this.labelService
      .reorder(items)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.showSuccess('Ordine delle etichette aggiornato.'),
        error: (error: unknown) =>
          this.notice.set({ type: 'danger', text: apiErrorMessage(error) }),
      });
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.saving.set(true);
    this.labelService
      .remove(target.id)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.showSuccess('Etichetta eliminata correttamente.');
          this.loadLabels(false);
        },
        error: (error: unknown) =>
          this.notice.set({ type: 'danger', text: apiErrorMessage(error) }),
      });
  }

  resetFilters(): void {
    this.filters.setValue({ search: '', categoryId: null, active: 'all' });
  }

  updateColor(color: string): void {
    this.form.controls.color.setValue(color);
    this.form.controls.color.markAsTouched();
  }

  updateIcon(icon: string): void {
    this.form.controls.icon.setValue(icon);
    this.form.controls.icon.markAsTouched();
  }

  private loadCategories(): void {
    this.categoryService
      .load({ active: true, sortBy: 'sortOrder', sortDirection: 'asc' })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) =>
          this.notice.set({ type: 'danger', text: apiErrorMessage(error) }),
      });
  }

  private loadLabels(showLoading = true): void {
    if (showLoading) this.loading.set(true);
    this.labelService
      .load(this.query())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        error: (error: unknown) =>
          this.notice.set({ type: 'danger', text: apiErrorMessage(error) }),
      });
  }

  private query(): LabelQueryParams {
    const filters = this.filters.getRawValue();
    return {
      search: filters.search.trim() || undefined,
      categoryId: filters.categoryId ?? undefined,
      active: filters.active === 'all' ? undefined : filters.active === 'true',
      sortBy: 'sortOrder',
      sortDirection: 'asc',
    };
  }

  private showSuccess(text: string): void {
    this.notice.set({ type: 'success', text });
  }
}
