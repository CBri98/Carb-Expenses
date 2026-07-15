import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { CategoryService } from '../../../core/services/category.service';
import type { Category } from '../../../shared/models/catalog.models';
import { CategoriesComponent } from './categories.component';

const defaultCategory: Category = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Casa',
  slug: 'casa',
  description: null,
  color: '#4F46E5',
  icon: 'bi-house',
  sortOrder: 1,
  isDefault: true,
  isCustom: false,
  isActive: true,
  createdAt: '2026-07-14T08:00:00.000Z',
  updatedAt: '2026-07-14T08:00:00.000Z',
};

describe('CategoriesComponent', () => {
  it('renderizza la lista e disabilita modifica/eliminazione sulle predefinite', async () => {
    const fixture = await createFixture();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.textContent).toContain('Casa');
    expect(
      element.querySelector<HTMLButtonElement>('button[aria-label="Modifica Casa"]')?.disabled,
    ).toBe(true);
    expect(
      element.querySelector<HTMLButtonElement>('button[aria-label="Elimina Casa"]')?.disabled,
    ).toBe(true);
  });

  it('apre e chiude il form categoria', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;

    component.openCreate();
    expect(component.formOpen()).toBe(true);
    component.closeForm();
    expect(component.formOpen()).toBe(false);
  });

  it('non salva nome vuoto o colore non valido', async () => {
    const { fixture, service } = await createFixtureWithService();
    const component = fixture.componentInstance;
    component.openCreate();
    component.form.patchValue({ name: '', color: 'blu' });

    component.save();

    expect(component.form.invalid).toBe(true);
    expect(service.create).not.toHaveBeenCalled();
  });

  it('salva una nuova categoria valida e chiude il form', async () => {
    const { fixture, service } = await createFixtureWithService();
    const component = fixture.componentInstance;
    component.openCreate();
    component.form.patchValue({ name: 'Casa nuova', color: '#2563EB', icon: 'bi-house-door' });

    component.save();

    expect(service.create).toHaveBeenCalled();
    expect(component.formOpen()).toBe(false);
  });
});

async function createFixture() {
  return (await createFixtureWithService()).fixture;
}

async function createFixtureWithService() {
  const categories = signal<Category[]>([defaultCategory]);
  const service = {
    categories: categories.asReadonly(),
    load: vi.fn(() => of(categories())),
    create: vi.fn(() => of({ ...defaultCategory, id: 'custom', isDefault: false, isCustom: true })),
    update: vi.fn(() => of(defaultCategory)),
    setStatus: vi.fn(() => of({ ...defaultCategory, isActive: false })),
    reorder: vi.fn(() => of(categories())),
    remove: vi.fn(() => of(undefined)),
  };
  await TestBed.configureTestingModule({
    imports: [CategoriesComponent],
    providers: [{ provide: CategoryService, useValue: service }],
  }).compileComponents();
  return { fixture: TestBed.createComponent(CategoriesComponent), service };
}
