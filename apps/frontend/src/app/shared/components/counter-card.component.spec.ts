import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { CounterCardComponent } from './catalog-display.components';

describe('CounterCardComponent', () => {
  it('distingue valore globale e risultato filtrato e resta interattiva', async () => {
    await TestBed.configureTestingModule({ imports: [CounterCardComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CounterCardComponent);
    const activated = vi.fn();
    fixture.componentRef.setInput('label', 'Totali');
    fixture.componentRef.setInput('value', 42);
    fixture.componentRef.setInput('valueHint', 'Totale globale');
    fixture.componentRef.setInput('filteredValue', 7);
    fixture.componentRef.setInput('interactive', true);
    fixture.componentInstance.activated.subscribe(activated);
    fixture.detectChanges();

    const card = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('article');
    expect(card?.textContent).toContain('42');
    expect(card?.textContent).toContain('Totale globale');
    expect(card?.textContent).toContain('Risultato filtrato: 7');
    card?.click();
    expect(activated).toHaveBeenCalledOnce();
  });
});
