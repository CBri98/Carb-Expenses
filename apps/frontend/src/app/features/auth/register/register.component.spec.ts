import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { register: vi.fn() } }
      ]
    }).compileComponents();
  });

  it('rifiuta una password senza numero', () => {
    const component = TestBed.createComponent(RegisterComponent).componentInstance;
    component.form.controls.password.setValue('solotesto');
    component.form.controls.passwordConfirmation.setValue('solotesto');

    expect(component.form.controls.password.valid).toBe(false);
    expect(component.form.invalid).toBe(true);
  });

  it('rifiuta password e conferma differenti', () => {
    const component = TestBed.createComponent(RegisterComponent).componentInstance;
    component.form.patchValue({
      password: 'Password1',
      passwordConfirmation: 'Password2'
    });
    component.form.controls.passwordConfirmation.markAsTouched();

    expect(component.form.hasError('passwordMismatch')).toBe(true);
    expect(component.passwordsMismatch()).toBe(true);
  });
});
