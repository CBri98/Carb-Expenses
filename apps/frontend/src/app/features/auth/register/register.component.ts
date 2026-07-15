import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { authErrorMessage } from '../../../core/auth/auth-error';
import type { RegisterRequest } from '../../../core/auth/auth.models';
import { AuthService } from '../../../core/auth/auth.service';

const matchingPasswords: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('password')?.value as string | undefined;
  const confirmation = control.get('passwordConfirmation')?.value as
    | string
    | undefined;

  return password === confirmation ? null : { passwordMismatch: true };
};

type RegisterControlName =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'password'
  | 'passwordConfirmation';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.maxLength(80)]],
      lastName: ['', [Validators.maxLength(80)]],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(128),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
        ]
      ],
      passwordConfirmation: ['', [Validators.required]]
    },
    { validators: matchingPasswords }
  );
  readonly submitting = signal(false);
  readonly passwordVisible = signal(false);
  readonly errorMessage = signal<string | null>(null);

  isInvalid(controlName: RegisterControlName): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  passwordsMismatch(): boolean {
    const confirmation = this.form.controls.passwordConfirmation;
    return (
      this.form.hasError('passwordMismatch') &&
      (confirmation.dirty || confirmation.touched)
    );
  }

  togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  submit(): void {
    this.errorMessage.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const request: RegisterRequest = {
      firstName: value.firstName.trim(),
      email: value.email.trim(),
      password: value.password,
      ...(value.lastName.trim() ? { lastName: value.lastName.trim() } : {})
    };

    this.submitting.set(true);
    this.authService
      .register(request)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => void this.router.navigate(['/dashboard']),
        error: (error: unknown) => this.errorMessage.set(authErrorMessage(error))
      });
  }
}
