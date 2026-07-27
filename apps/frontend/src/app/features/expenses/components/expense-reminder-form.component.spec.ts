import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { ExpenseReminderFormComponent } from './expense-reminder-form.component';

describe('ExpenseReminderFormComponent', () => {
  it('mostra i preset soltanto per una spesa pianificata e impedisce duplicati', async () => {
    const fixture = await createFixture();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('3 giorni prima');
    const emitted = vi.fn();
    fixture.componentInstance.draftsChanged.subscribe(emitted);
    const input = document.createElement('input'); input.checked = true;
    const event = new Event('change'); Object.defineProperty(event, 'target', { value: input });
    fixture.componentInstance.toggle('THREE_DAYS_BEFORE', event);
    fixture.componentInstance.toggle('THREE_DAYS_BEFORE', event);
    await Promise.resolve();
    expect(fixture.componentInstance.selected().size).toBe(1);
    expect(emitted).toHaveBeenLastCalledWith([{ type: 'THREE_DAYS_BEFORE' }]);
  });

  it('valida custom successivo alla spesa e converte un custom valido', async () => {
    const fixture = await createFixture();
    const input = document.createElement('input'); input.checked = true;
    const event = new Event('change'); Object.defineProperty(event, 'target', { value: input });
    fixture.componentInstance.toggle('CUSTOM', event);
    fixture.componentInstance.customChanged('2099-08-01T10:00');
    expect(fixture.componentInstance.customError()).toContain('precedere');
    fixture.componentInstance.customChanged('2099-07-19T09:00');
    expect(fixture.componentInstance.customError()).toBeNull();
  });
});

async function createFixture() {
  await TestBed.configureTestingModule({ imports: [ExpenseReminderFormComponent] }).compileComponents();
  const fixture = TestBed.createComponent(ExpenseReminderFormComponent);
  fixture.componentRef.setInput('status', 'PLANNED');
  fixture.componentRef.setInput('expenseDate', '2099-07-20');
  fixture.componentRef.setInput('expenseTime', '10:00');
  fixture.detectChanges();
  await Promise.resolve();
  return fixture;
}
