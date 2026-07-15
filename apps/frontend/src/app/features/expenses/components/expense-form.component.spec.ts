import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { CategoryService } from '../../../core/services/category.service';
import { LabelService } from '../../../core/services/label.service';
import type { Category, Label } from '../../../shared/models/catalog.models';
import { ExpenseFormComponent } from './expense-form.component';

const category: Category = {
  id: '10000000-0000-4000-8000-000000000001', name: 'Casa', slug: 'casa',
  description: null, color: '#4F46E5', icon: 'bi-house', sortOrder: 1,
  isDefault: true, isCustom: false, isActive: true,
  createdAt: '2026-07-14T08:00:00.000Z', updatedAt: '2026-07-14T08:00:00.000Z',
};
const label: Label = {
  id: '20000000-0000-4000-8000-000000000001', name: 'Condivisa', slug: 'condivisa',
  description: null, color: '#2563EB', icon: 'bi-people', categoryId: null, category: null,
  sortOrder: 1, isDefault: false, isActive: true,
  createdAt: '2026-07-14T08:00:00.000Z', updatedAt: '2026-07-14T08:00:00.000Z',
};

describe('ExpenseFormComponent', () => {
  it('propone carta di debito come metodo di pagamento iniziale', async () => {
    const fixture = await createFixture();
    expect(fixture.componentInstance.form.controls.paymentMethod.value).toBe('DEBIT_CARD');
  });

  it('valida descrizione, importo, data e categoria', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;
    component.form.patchValue({ description: '', amount: '0', expenseDate: '', categoryId: '' });
    component.submit();
    expect(component.form.invalid).toBe(true);
  });

  it('accetta importo con virgola e selezione multipla etichette', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;
    const submitted = vi.fn();
    component.submitted.subscribe(submitted);
    component.form.patchValue({
      description: 'Spesa test', amount: '12,50', expenseDate: '2026-07-14', categoryId: category.id,
    });
    const input = document.createElement('input');
    input.checked = true;
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: input });
    component.toggleLabel(label.id, event);
    component.submit();
    expect(submitted).toHaveBeenCalledWith(expect.objectContaining({
      amount: '12.50', categoryId: category.id, labelIds: [label.id],
    }));
  });

  it('propone PLANNED per una data futura', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;
    component.form.controls.expenseDate.setValue('2099-01-01');
    expect(component.futureDate()).toBe(true);
    expect(component.form.controls.status.value).toBe('PLANNED');
  });

  it('non sovrascrive uno stato scelto manualmente', async () => {
    const fixture = await createFixture();
    const component = fixture.componentInstance;
    component.form.controls.status.setValue('CANCELLED');
    component.statusChangedByUser();
    component.form.controls.expenseDate.setValue('2099-01-01');
    expect(component.form.controls.status.value).toBe('CANCELLED');
  });
});

async function createFixture() {
  const categories = signal([category]);
  const labels = signal([label]);
  await TestBed.configureTestingModule({
    imports: [ExpenseFormComponent],
    providers: [
      { provide: CategoryService, useValue: { categories: categories.asReadonly(), load: vi.fn(() => of(categories())) } },
      { provide: LabelService, useValue: { labels: labels.asReadonly(), load: vi.fn(() => of(labels())) } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ExpenseFormComponent);
  fixture.detectChanges();
  return fixture;
}
