import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { CategoryService } from '../../core/services/category.service';
import { LabelService } from '../../core/services/label.service';
import { RecurrenceService } from '../../core/services/recurrence.service';
import { RecurrenceFormComponent } from './recurrence-form.component';

describe('RecurrenceFormComponent', () => {
  it('valida date e importo, configura i template ed emette un payload normalizzato', async () => {
    const preview = vi.fn(() => of({ dates: ['2026-07-31', '2026-08-31'] }));
    await TestBed.configureTestingModule({
      imports: [RecurrenceFormComponent],
      providers: [
        {
          provide: CategoryService,
          useValue: {
            categories: signal([{ id: 'category-1', name: 'Casa' }]).asReadonly(),
            load: vi.fn(() => of([])),
          },
        },
        {
          provide: LabelService,
          useValue: {
            labels: signal([{ id: 'label-1', name: 'Fissa' }]).asReadonly(),
            load: vi.fn(() => of([])),
          },
        },
        { provide: RecurrenceService, useValue: { preview } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(RecurrenceFormComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    const emitted = vi.fn();
    component.submitted.subscribe(emitted);

    component.form.patchValue({
      name: '  Affitto casa  ',
      amount: '0',
      categoryId: 'category-1',
      labelIds: ['label-1'],
      startDate: '2026-07-31',
      endDate: '2026-07-01',
    });
    component.submit();
    expect(emitted).not.toHaveBeenCalled();
    expect(component.form.hasError('dateRange')).toBe(true);

    component.toggleReminder('THREE_DAYS_BEFORE', true);
    component.form.patchValue({ amount: '850,50', endDate: '', reminderTime: '08:30' });
    component.submit();

    expect(emitted).toHaveBeenCalledWith(expect.objectContaining({
      updateScope: 'RULE_ONLY',
      payload: expect.objectContaining({
        name: 'Affitto casa',
        description: 'Affitto casa',
        amount: '850.50',
        startDate: '2026-07-31',
        labelIds: ['label-1'],
        reminderTemplates: [
          { type: 'THREE_DAYS_BEFORE', reminderTime: '08:30' },
          { type: 'SAME_DAY', reminderTime: '08:30' },
        ],
      }),
    }));
    expect(fixture.nativeElement.querySelector('#recurrence-description')).toBeNull();
  });
});
