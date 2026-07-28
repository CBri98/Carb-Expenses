import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { PageHeaderComponent } from './catalog-display.components';

describe('PageHeaderComponent', () => {
  it('richiede e mostra il sovratitolo della sezione sidebar', async () => {
    await TestBed.configureTestingModule({ imports: [PageHeaderComponent] }).compileComponents();
    const fixture = TestBed.createComponent(PageHeaderComponent);
    fixture.componentRef.setInput('eyebrow', 'Gestione');
    fixture.componentRef.setInput('title', 'Spese');
    fixture.detectChanges();

    const header = fixture.nativeElement as HTMLElement;
    expect(header.querySelector('p')?.textContent).toBe('Gestione');
    expect(header.querySelector('h1')?.textContent).toBe('Spese');
  });
});
