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
    const year = fixture.nativeElement.querySelector('#test-period-year') as HTMLInputElement;
    expect(fixture.componentInstance.monthOptions[6]).toEqual({ value: 7, code: '07', label: 'Luglio' });
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
    fixture.componentInstance.changeMonth(7);
    expect(emitted).toHaveBeenCalledWith({ month: 7, year: 2026 });
  });
});
