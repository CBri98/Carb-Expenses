import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { MultiselectValueComponent } from './multiselect-value.component';

describe('MultiselectValueComponent', () => {
  it('mantiene colore, icona e padding del valore selezionato', async () => {
    await TestBed.configureTestingModule({ imports: [MultiselectValueComponent] }).compileComponents();
    const fixture = TestBed.createComponent(MultiselectValueComponent);
    fixture.componentRef.setInput('label', 'Casa');
    fixture.componentRef.setInput('icon', 'bi-house');
    fixture.componentRef.setInput('color', '#2563eb');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.multi-value')?.getAttribute('style')).toContain('#2563eb');
    expect(element.querySelector('i.bi-house')).not.toBeNull();
    expect(element.querySelector('button')?.getAttribute('aria-label')).toBe('Rimuovi Casa');
  });

  it('emette la rimozione del singolo valore', async () => {
    await TestBed.configureTestingModule({ imports: [MultiselectValueComponent] }).compileComponents();
    const fixture = TestBed.createComponent(MultiselectValueComponent);
    fixture.componentRef.setInput('label', 'Casa');
    const removed = vi.fn();
    fixture.componentInstance.removed.subscribe(removed);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('button')?.click();
    expect(removed).toHaveBeenCalledOnce();
  });
});
