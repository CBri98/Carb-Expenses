import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { RecurrenceExpenseIndicatorComponent } from './recurrence-display.components';

describe('RecurrenceExpenseIndicatorComponent', () => {
  it('mostra un indicatore testuale con icona senza classi badge', async () => {
    await TestBed.configureTestingModule({
      imports: [RecurrenceExpenseIndicatorComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(RecurrenceExpenseIndicatorComponent);
    fixture.componentRef.setInput('recurrenceId', 'rule-1');
    fixture.componentRef.setInput('recurrenceName', 'Affitto');
    fixture.detectChanges();

    const link = (fixture.nativeElement as HTMLElement).querySelector('a');
    expect(link?.textContent).toContain('Spesa ricorrente');
    expect(link?.classList.contains('badge')).toBe(false);
    expect(link?.querySelector('.bi-arrow-repeat')).not.toBeNull();
    expect(link?.getAttribute('title')).toBe('Affitto');
  });
});
