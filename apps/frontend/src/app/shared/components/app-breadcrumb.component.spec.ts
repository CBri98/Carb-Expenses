import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';

import { AppBreadcrumbComponent } from './app-breadcrumb.component';

describe('AppBreadcrumbComponent', () => {
  it('nasconde il raggruppamento della sidebar, rende i link intermedi e marca la pagina corrente', async () => {
    await TestBed.configureTestingModule({
      imports: [AppBreadcrumbComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppBreadcrumbComponent);
    fixture.componentRef.setInput('items', [
      { label: 'Gestione', link: '/expenses' },
      { label: 'Spese', link: '/expenses' },
      { label: 'Dettaglio' },
    ]);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const elements = Array.from(root.querySelectorAll<HTMLElement>('.breadcrumb-item'));
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('a'));

    expect(elements.map((item) => item.textContent?.trim())).toEqual([
      'Spese',
      'Dettaglio',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/expenses']);
    expect(elements.at(-1)?.getAttribute('aria-current')).toBe('page');
    expect(elements.at(-1)?.querySelector('a')).toBeNull();
  });
});
