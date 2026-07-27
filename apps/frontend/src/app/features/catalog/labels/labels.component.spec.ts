import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { CategoryService } from '../../../core/services/category.service';
import { LabelService } from '../../../core/services/label.service';
import type { Category, Label } from '../../../shared/models/catalog.models';
import { LabelsComponent } from './labels.component';

const category: Category = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Lavoro',
  slug: 'lavoro',
  description: null,
  color: '#0369A1',
  icon: 'bi-briefcase',
  sortOrder: 1,
  isDefault: true,
  isCustom: false,
  isActive: true,
  createdAt: '2026-07-14T08:00:00.000Z',
  updatedAt: '2026-07-14T08:00:00.000Z',
};
const label: Label = {
  id: '20000000-0000-4000-8000-000000000001',
  name: 'Pranzo di lavoro',
  slug: 'pranzo-di-lavoro',
  description: null,
  color: '#F59E0B',
  icon: 'bi-briefcase',
  categoryId: category.id,
  category,
  sortOrder: 1,
  isDefault: false,
  isActive: true,
  createdAt: '2026-07-14T08:00:00.000Z',
  updatedAt: '2026-07-14T08:00:00.000Z',
};

describe('LabelsComponent', () => {
  it('renderizza etichetta e categoria associata', async () => {
    const { fixture } = await createFixture();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Pranzo di lavoro');
    expect(text).toContain('Lavoro');
  });

  it('valida nome e colore prima del salvataggio', async () => {
    const { fixture, labels } = await createFixture();
    const component = fixture.componentInstance;
    component.openCreate();
    component.form.patchValue({ name: '', color: '#12' });

    component.save();

    expect(component.form.invalid).toBe(true);
    expect(labels.create).not.toHaveBeenCalled();
  });

  it('crea una etichetta associata a una categoria', async () => {
    const { fixture, labels } = await createFixture();
    const component = fixture.componentInstance;
    component.openCreate();
    component.form.patchValue({
      name: 'Spese condivise',
      color: '#16A34A',
      icon: 'bi-people',
      categoryId: category.id,
    });

    component.save();

    expect(labels.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Spese condivise',
        categoryId: category.id,
      }),
    );
    expect(component.formOpen()).toBe(false);
  });

  it('apre la conferma di eliminazione', async () => {
    const { fixture } = await createFixture();
    fixture.componentInstance.deleteTarget.set(label);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Elimina etichetta');
  });
});

async function createFixture() {
  const categoryItems = signal<Category[]>([category]);
  const labelItems = signal<Label[]>([label]);
  const categories = {
    categories: categoryItems.asReadonly(),
    load: vi.fn(() => of(categoryItems())),
  };
  const labels = {
    labels: labelItems.asReadonly(),
    load: vi.fn(() => of(labelItems())),
    summary: vi.fn(() => of({ total: 1, withCategory: 1, withoutCategory: 0, unused: 1 })),
    create: vi.fn(() => of({ ...label, name: 'Spese condivise' })),
    update: vi.fn(() => of(label)),
    setStatus: vi.fn(() => of({ ...label, isActive: false })),
    reorder: vi.fn(() => of(labelItems())),
    remove: vi.fn(() => of(undefined)),
  };
  await TestBed.configureTestingModule({
    imports: [LabelsComponent],
    providers: [
      { provide: CategoryService, useValue: categories },
      { provide: LabelService, useValue: labels },
    ],
  }).compileComponents();
  return { fixture: TestBed.createComponent(LabelsComponent), labels };
}
