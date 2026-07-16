import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { MonthSelectorComponent } from './month-selector.component';

describe('MonthSelectorComponent', () => {
  it('espone label accessibili e ripristina il periodo ricevuto', async () => {
    await TestBed.configureTestingModule({ imports: [MonthSelectorComponent] }).compileComponents();
    const fixture = TestBed.createComponent(MonthSelectorComponent);
    fixture.componentRef.setInput('period', { month: 7, year: 2026 });
    fixture.componentRef.setInput('idPrefix', 'test-period');
    fixture.detectChanges();
    const month = fixture.nativeElement.querySelector('#test-period-month') as HTMLSelectElement;
    const year = fixture.nativeElement.querySelector('#test-period-year') as HTMLSelectElement;
    expect(month.value).toBe('7');
    expect(year.value).toBe('2026');
    expect(fixture.nativeElement.querySelector('label[for="test-period-month"]')).not.toBeNull();
  });

  it('emette mese e anno senza produrre richieste incomplete', async () => {
    await TestBed.configureTestingModule({ imports: [MonthSelectorComponent] }).compileComponents();
    const fixture = TestBed.createComponent(MonthSelectorComponent);
    fixture.componentRef.setInput('period', { month: 6, year: 2026 });
    const emitted = vi.fn();
    fixture.componentInstance.periodChange.subscribe(emitted);
    fixture.detectChanges();
    const month = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    month.value = '7';
    month.dispatchEvent(new Event('change'));
    expect(emitted).toHaveBeenCalledWith({ month: 7, year: 2026 });
  });
});
