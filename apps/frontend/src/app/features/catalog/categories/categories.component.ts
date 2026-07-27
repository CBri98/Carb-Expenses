import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  NgLabelTemplateDirective,
  NgOptionTemplateDirective,
  NgSelectComponent,
} from '@ng-select/ng-select';
import { debounceTime, finalize, forkJoin } from 'rxjs';

import { CategoryService } from '../../../core/services/category.service';
import { SettingsStore } from '../../../core/services/settings.store';
import { apiErrorMessage } from '../../../core/services/api-error';
import {
  CategoryBadgeComponent,
  CounterCardComponent,
  EmptyStateComponent,
  LoadingSkeletonComponent,
  PageHeaderComponent,
  StatusBadgeComponent,
} from '../../../shared/components/catalog-display.components';
import { ColorPickerComponent } from '../../../shared/components/color-picker.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog.component';
import { IconPickerComponent } from '../../../shared/components/icon-picker.component';
import { FilterPanelComponent } from '../../../shared/components/filter-panel.component';
import { EscapeCloseDirective } from '../../../shared/directives/escape-close.directive';
import type {
  Category,
  CategoryQueryParams,
  CreateCategoryRequest,
  ReorderItem,
  CategorySummary,
  UpdateCategoryRequest,
} from '../../../shared/models/catalog.models';

interface Notice {
  type: 'success' | 'danger';
  text: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgSelectComponent,
    NgOptionTemplateDirective,
    NgLabelTemplateDirective,
    PageHeaderComponent,
    CategoryBadgeComponent,
    StatusBadgeComponent,
    EmptyStateComponent,
    LoadingSkeletonComponent,
    ColorPickerComponent,
    IconPickerComponent,
    ConfirmDialogComponent,
    EscapeCloseDirective,
    DragDropModule,
    CounterCardComponent,
    FilterPanelComponent,
  ],
  templateUrl: './categories.component.html',
  styleUrl: '../catalog-page.scss',
})
export class CategoriesComponent {
  private readonly categoryService = inject(CategoryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(FormBuilder);
  private readonly settings = inject(SettingsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly categories = this.categoryService.categories;
  readonly availableIcons = computed(() => this.settings.icons().enabledCategoryIcons);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly editing = signal<Category | null>(null);
  readonly deleteTarget = signal<Category | null>(null);
  readonly notice = signal<Notice | null>(null);
  readonly reordering = signal(false);
  readonly filtersExpanded = signal(false);
  readonly summary = signal<CategorySummary>({ total: 0, active: 0, inactive: 0, custom: 0 });
  private readonly filterVersion = signal(0);
  readonly typeOptions = [
    { value: 'all', label: 'Tutte', icon: 'bi-collection' },
    { value: 'default', label: 'Predefinite', icon: 'bi-shield-check' },
    { value: 'custom', label: 'Personalizzate', icon: 'bi-person-gear' },
  ] as const;
  readonly activeOptions = [
    { value: 'all', label: 'Tutti', icon: 'bi-circle-half' },
    { value: 'true', label: 'Attive', icon: 'bi-check-circle' },
    { value: 'false', label: 'Disattivate', icon: 'bi-pause-circle' },
  ] as const;
  readonly canReorder = computed(() => {
    this.filterVersion();
    const filters = this.filters.getRawValue();
    return !this.reordering() && !filters.search.trim() && filters.type === 'all' && filters.active === 'all';
  });

  readonly filters = this.formBuilder.nonNullable.group({
    search: [''],
    type: ['all'],
    active: ['all'],
  });

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]],
    color: ['#2563EB', [Validators.required, Validators.pattern(/^#[0-9A-Fa-f]{6}$/)]],
    icon: ['bi-tag', [Validators.required, Validators.pattern(/^bi-[a-z0-9-]+$/)]],
    sortOrder: [0, [Validators.required, Validators.min(0)]],
    isActive: [true],
  });

  constructor() {
    this.settings.ensureLoaded();
    this.filters.valueChanges
      .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.filterVersion.update((value) => value + 1); this.navigateFilters(); });
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const type = params.get('type');
      const active = params.get('active');
      this.filters.setValue({
        search: params.get('search') ?? '',
        type: type === 'default' || type === 'custom' ? type : 'all',
        active: active === 'true' || active === 'false' ? active : 'all',
      }, { emitEvent: false });
      this.filterVersion.update((value) => value + 1);
      this.load();
    });
  }

  activeFilterCount(): number {
    const value = this.filters.getRawValue();
    return Number(value.type !== 'all') + Number(value.active !== 'all');
  }

  filterSummary(): string {
    const value = this.filters.getRawValue();
    const parts = [
      value.type !== 'all' ? this.typeOptions.find((item) => item.value === value.type)?.label : null,
      value.active !== 'all' ? this.activeOptions.find((item) => item.value === value.active)?.label : null,
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : 'Nessun filtro strutturato applicato';
  }

  openCreate(): void {
    const nextOrder = Math.max(0, ...this.categories().map((item) => item.sortOrder)) + 1;
    this.editing.set(null);
    this.form.reset({
      name: '',
      description: '',
      color: '#2563EB',
      icon: this.availableIcons()[0] ?? 'bi-house',
      sortOrder: nextOrder,
      isActive: true,
    });
    this.formOpen.set(true);
  }

  openEdit(category: Category): void {
    if (category.isDefault) return;
    this.editing.set(category);
    this.form.reset({
      name: category.name,
      description: category.description ?? '',
      color: category.color,
      icon: category.icon,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
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
    const payload: CreateCategoryRequest = {
      name: value.name,
      description: value.description.trim() || null,
      color: value.color,
      icon: value.icon,
      sortOrder: value.sortOrder,
      isActive: value.isActive,
    };
    const request = editing
      ? this.categoryService.update(editing.id, payload satisfies UpdateCategoryRequest)
      : this.categoryService.create(payload);

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
            editing ? 'Categoria aggiornata correttamente.' : 'Categoria creata correttamente.',
          );
          this.load(false);
        },
        error: (error: unknown) =>
          this.notice.set({ type: 'danger', text: apiErrorMessage(error) }),
      });
  }

  toggleStatus(category: Category): void {
    this.categoryService
      .setStatus(category.id, !category.isActive)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showSuccess(`Categoria ${category.isActive ? 'disattivata' : 'attivata'}.`);
          this.load(false);
        },
        error: (error: unknown) =>
          this.notice.set({ type: 'danger', text: apiErrorMessage(error) }),
      });
  }

  move(index: number, direction: -1 | 1): void {
    if (!this.canReorder()) return;
    const target = index + direction;
    const ordered = [...this.categories()];
    if (target < 0 || target >= ordered.length) return;
    [ordered[index], ordered[target]] = [ordered[target]!, ordered[index]!];
    this.persistOrder(ordered);
  }

  drop(event: CdkDragDrop<Category[]>): void {
    if (!this.canReorder() || event.previousIndex === event.currentIndex) return;
    const ordered = [...this.categories()];
    moveItemInArray(ordered, event.previousIndex, event.currentIndex);
    this.persistOrder(ordered);
  }

  private persistOrder(ordered: readonly Category[]): void {
    const items: ReorderItem[] = ordered.map((category, itemIndex) => ({
      id: category.id, sortOrder: itemIndex + 1,
    }));
    this.reordering.set(true);
    this.categoryService
      .reorder(items)
      .pipe(finalize(() => this.reordering.set(false)), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.showSuccess('Ordine delle categorie aggiornato.'),
        error: (error: unknown) =>
          this.notice.set({ type: 'danger', text: apiErrorMessage(error) }),
      });
  }

  confirmDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.saving.set(true);
    this.categoryService
      .remove(target.id)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.deleteTarget.set(null);
          this.showSuccess('Categoria eliminata correttamente.');
          this.load(false);
        },
        error: (error: unknown) =>
          this.notice.set({ type: 'danger', text: apiErrorMessage(error) }),
      });
  }

  resetFilters(): void {
    this.filters.setValue({ search: '', type: 'all', active: 'all' });
  }

  filterFromSummary(type: 'all' | 'custom' = 'all', active: 'all' | 'true' | 'false' = 'all'): void {
    this.filters.patchValue({ type, active });
  }

  updateColor(color: string): void {
    this.form.controls.color.setValue(color);
    this.form.controls.color.markAsTouched();
  }

  updateIcon(icon: string): void {
    this.form.controls.icon.setValue(icon);
    this.form.controls.icon.markAsTouched();
  }

  private load(showLoading = true): void {
    if (showLoading) this.loading.set(true);
    const query = this.query();
    forkJoin({
      items: this.categoryService.load(query),
      summary: this.categoryService.summary(query),
    })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ summary }) => this.summary.set(summary),
        error: (error: unknown) =>
          this.notice.set({ type: 'danger', text: apiErrorMessage(error) }),
      });
  }

  private query(): CategoryQueryParams {
    const filters = this.filters.getRawValue();
    return {
      search: filters.search.trim() || undefined,
      type: filters.type as CategoryQueryParams['type'],
      active: filters.active === 'all' ? undefined : filters.active === 'true',
      sortBy: 'sortOrder',
      sortDirection: 'asc',
    };
  }

  private navigateFilters(): void {
    const value = this.filters.getRawValue();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        ...(value.search.trim() ? { search: value.search.trim() } : {}),
        ...(value.type !== 'all' ? { type: value.type } : {}),
        ...(value.active !== 'all' ? { active: value.active } : {}),
      },
      replaceUrl: true,
    });
  }

  private showSuccess(text: string): void {
    this.notice.set({ type: 'success', text });
  }
}
