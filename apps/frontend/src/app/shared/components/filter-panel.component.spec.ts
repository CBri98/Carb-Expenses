import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterPanelComponent } from './filter-panel.component';

@Component({
  standalone: true,
  imports: [FilterPanelComponent],
  template: `
    <app-filter-panel
      title="Filtri spese"
      titleId="filters-title"
      panelId="filters-panel"
      [expanded]="expanded()"
      [activeCount]="2"
      summary="Categoria e stato"
      (expandedChange)="expanded.set($event)"
      (resetRequested)="resetCount.set(resetCount() + 1)"
    >
      <label for="search">Ricerca</label><input id="search" />
    </app-filter-panel>
  `,
})
class FilterPanelHostComponent {
  readonly expanded = signal(false);
  readonly resetCount = signal(0);
}

describe('FilterPanelComponent', () => {
  let fixture: ComponentFixture<FilterPanelHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FilterPanelHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FilterPanelHostComponent);
    fixture.detectChanges();
  });

  it('espone riepilogo, conteggio e stato accessibile quando è chiuso', () => {
    const element = fixture.nativeElement as HTMLElement;
    const section = element.querySelector('section');
    const toggle = element.querySelector<HTMLButtonElement>('.filters__toggle');

    expect(section?.getAttribute('aria-labelledby')).toBe('filters-title');
    expect(element.textContent).toContain('2 attivi');
    expect(element.textContent).toContain('Categoria e stato');
    expect(toggle?.getAttribute('aria-controls')).toBe('filters-panel');
    expect(toggle?.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('#filters-panel')).toBeNull();
  });

  it('apre il contenuto proiettato e inoltra la richiesta di reset', () => {
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.filters__toggle')?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.expanded()).toBe(true);
    expect(element.querySelector('#filters-panel input')).not.toBeNull();
    expect(element.querySelector('.filters__toggle')?.getAttribute('aria-expanded')).toBe('true');

    fixture.componentInstance.expanded.set(false);
    fixture.detectChanges();
    const resetButton = [...element.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.includes('Reimposta'));
    resetButton?.click();

    expect(fixture.componentInstance.resetCount()).toBe(1);
  });
});
