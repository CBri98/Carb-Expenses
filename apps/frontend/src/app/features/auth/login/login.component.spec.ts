import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { AuthService } from '../../../core/auth/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  it('non invia email non valida o password troppo corta', async () => {
    const login = vi.fn();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { login } }
      ]
    }).compileComponents();
    const component = TestBed.createComponent(LoginComponent).componentInstance;
    component.form.setValue({ email: 'non-valida', password: 'breve' });

    component.submit();

    expect(component.form.invalid).toBe(true);
    expect(login).not.toHaveBeenCalled();
  });
});
