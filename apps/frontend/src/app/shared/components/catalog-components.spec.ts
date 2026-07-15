import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { CategoryBadgeComponent, LabelBadgeComponent } from './catalog-display.components';
import { ColorPickerComponent } from './color-picker.component';
import { IconPickerComponent } from './icon-picker.component';

describe('Componenti condivisi catalogo', () => {
  it('mostra nome e icona nel badge categoria', async () => {
    await TestBed.configureTestingModule({ imports: [CategoryBadgeComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CategoryBadgeComponent);
    fixture.componentRef.setInput('name', 'Casa');
    fixture.componentRef.setInput('color', '#2563EB');
    fixture.componentRef.setInput('icon', 'bi-house');
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Casa');
    expect(element.querySelector('i')?.classList.contains('bi-house')).toBe(true);
  });

  it('usa l’icona predefinita nel badge etichetta', async () => {
    await TestBed.configureTestingModule({ imports: [LabelBadgeComponent] }).compileComponents();
    const fixture = TestBed.createComponent(LabelBadgeComponent);
    fixture.componentRef.setInput('name', 'Condivisa');
    fixture.componentRef.setInput('color', '#16A34A');
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('i')?.classList.contains('bi-tag'),
    ).toBe(true);
  });

  it('emette l’icona selezionata', async () => {
    await TestBed.configureTestingModule({ imports: [IconPickerComponent] }).compileComponents();
    const fixture = TestBed.createComponent(IconPickerComponent);
    const selected = signal('');
    fixture.componentInstance.valueChange.subscribe((value) => selected.set(value));
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      'button[aria-label="Seleziona bi-house"]',
    );
    button?.click();

    expect(selected()).toBe('bi-house');
  });

  it('sincronizza il valore testuale del colore', async () => {
    await TestBed.configureTestingModule({ imports: [ColorPickerComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ColorPickerComponent);
    const changed = vi.fn();
    fixture.componentInstance.valueChange.subscribe(changed);
    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(
      'input[type="text"]',
    );
    if (!input) throw new Error('Input colore non trovato');
    input.value = '#abcdef';
    input.dispatchEvent(new Event('input'));

    expect(changed).toHaveBeenCalledWith('#ABCDEF');
  });
});
