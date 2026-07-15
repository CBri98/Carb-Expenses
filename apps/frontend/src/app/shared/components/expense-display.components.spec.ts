import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ExpenseStatusBadgeComponent, PaymentMethodBadgeComponent } from './expense-display.components';

describe('badge spese', () => {
  it('mostra stato con testo e icona', async () => {
    await TestBed.configureTestingModule({ imports: [ExpenseStatusBadgeComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ExpenseStatusBadgeComponent);
    fixture.componentRef.setInput('status', 'PLANNED');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Pianificata');
    expect(element.querySelector('i')?.classList.contains('bi-clock')).toBe(true);
  });

  it('traduce il metodo di pagamento', async () => {
    await TestBed.configureTestingModule({ imports: [PaymentMethodBadgeComponent] }).compileComponents();
    const fixture = TestBed.createComponent(PaymentMethodBadgeComponent);
    fixture.componentRef.setInput('method', 'BANK_TRANSFER');
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Bonifico');
  });
});
