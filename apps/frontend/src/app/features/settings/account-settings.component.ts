import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthStateService } from '../../core/auth/auth-state.service';
import { apiErrorMessage } from '../../core/services/api-error';
import { SettingsStore } from '../../core/services/settings.store';
import { ItalianDateTimePipe } from '../../shared/components/expense-display.components';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [ReactiveFormsModule, ItalianDateTimePipe],
  template: `
    <article class="card settings-card">
      <div class="settings-card__header"><h2 class="h5 mb-1">Dati account</h2><p class="small text-body-secondary mb-0">Aggiorna nome ed email. Il cambio email richiede la password corrente.</p></div>
      <div class="settings-card__body">
        @if (notice(); as message) { <div class="alert" [class.alert-success]="message.tone === 'success'" [class.alert-danger]="message.tone === 'danger'" role="status">{{ message.text }}</div> }
        <form [formGroup]="accountForm" (ngSubmit)="saveAccount()">
          <div class="row g-3">
            <div class="col-12 col-md-6"><label class="form-label" for="account-first-name">Nome</label><input id="account-first-name" class="form-control" formControlName="firstName" maxlength="80" autocomplete="given-name" /></div>
            <div class="col-12 col-md-6"><label class="form-label" for="account-last-name">Cognome</label><input id="account-last-name" class="form-control" formControlName="lastName" maxlength="80" autocomplete="family-name" /></div>
            <div class="col-12"><label class="form-label" for="account-email">Email</label><input id="account-email" class="form-control" type="email" formControlName="email" autocomplete="email" /></div>
            @if (emailChanged()) { <div class="col-12"><label class="form-label" for="account-current-password">Password corrente</label><input id="account-current-password" class="form-control" type="password" formControlName="currentPassword" maxlength="128" autocomplete="current-password" /><div class="form-text">Le altre sessioni verranno revocate dopo il cambio email.</div></div> }
            @if (account(); as current) { <div class="col-12 small text-body-secondary">Account creato il {{ current.createdAt | italianDateTime }} · Ultimo aggiornamento {{ current.updatedAt | italianDateTime }}</div> }
          </div>
          <div class="settings-actions mt-3"><button class="btn btn-primary" type="submit" [disabled]="savingAccount() || accountForm.invalid || !accountForm.dirty">@if (savingAccount()) { <span class="spinner-border spinner-border-sm me-2"></span> }Salva account</button></div>
        </form>
      </div>
    </article>

    <article class="card settings-card">
      <div class="settings-card__header"><h2 class="h5 mb-1">Password</h2><p class="small text-body-secondary mb-0">Dopo il cambio verranno revocate tutte le sessioni e dovrai accedere di nuovo.</p></div>
      <div class="settings-card__body">
        <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
          <div class="row g-3">
            <div class="col-12"><label class="form-label" for="password-current">Password corrente</label><input id="password-current" class="form-control" type="password" formControlName="currentPassword" autocomplete="current-password" /></div>
            <div class="col-12 col-md-6"><label class="form-label" for="password-new">Nuova password</label><input id="password-new" class="form-control" type="password" formControlName="newPassword" autocomplete="new-password" /><div class="form-text">Almeno 8 caratteri, una lettera e un numero.</div></div>
            <div class="col-12 col-md-6"><label class="form-label" for="password-confirm">Conferma nuova password</label><input id="password-confirm" class="form-control" type="password" formControlName="confirmPassword" autocomplete="new-password" />@if (passwordMismatch()) { <div class="invalid-feedback d-block">Le password non coincidono.</div> }</div>
          </div>
          <div class="settings-actions mt-3"><button class="btn btn-primary" type="submit" [disabled]="savingPassword() || passwordForm.invalid || passwordMismatch()">Cambia password</button></div>
        </form>
      </div>
    </article>

    <article class="card settings-card">
      <div class="settings-card__header"><h2 class="h5 mb-1">Sessioni</h2><p class="small text-body-secondary mb-0">Revoca gli accessi sugli altri dispositivi senza interrompere questo.</p></div>
      <div class="settings-card__body d-flex flex-column flex-sm-row gap-3 align-items-sm-center justify-content-between"><p class="mb-0">La sessione corrente è identificata dal refresh token sicuro.</p><button class="btn btn-outline-danger" type="button" [disabled]="revoking()" (click)="revokeOtherSessions()">Revoca altre sessioni</button></div>
    </article>
  `,
  styleUrl: './settings.scss',
})
export class AccountSettingsComponent {
  private readonly store = inject(SettingsStore);
  private readonly authState = inject(AuthStateService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly builder = inject(FormBuilder);
  readonly account = () => this.store.settings()?.account ?? null;
  readonly savingAccount = signal(false);
  readonly savingPassword = signal(false);
  readonly revoking = signal(false);
  readonly notice = signal<{ tone: 'success' | 'danger'; text: string } | null>(null);
  private loadedAccountId: string | null = null;

  readonly accountForm = this.builder.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(80)]],
    lastName: ['', Validators.maxLength(80)],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(191)]],
    currentPassword: ['', Validators.maxLength(128)],
  });
  readonly passwordForm = this.builder.nonNullable.group({
    currentPassword: ['', [Validators.required, Validators.maxLength(128)]],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128), Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)]],
    confirmPassword: ['', [Validators.required, Validators.maxLength(128)]],
  });

  constructor() {
    this.store.ensureLoaded();
    effect(() => {
      const account = this.store.settings()?.account;
      if (!account || account.id === this.loadedAccountId) return;
      this.loadedAccountId = account.id;
      this.accountForm.reset({ firstName: account.firstName, lastName: account.lastName ?? '', email: account.email, currentPassword: '' });
    });
  }

  emailChanged(): boolean {
    return Boolean(this.account() && this.accountForm.controls.email.value.trim().toLowerCase() !== this.account()!.email);
  }

  passwordMismatch(): boolean {
    const form = this.passwordForm.getRawValue();
    return Boolean(form.confirmPassword && form.newPassword !== form.confirmPassword);
  }

  saveAccount(): void {
    if (this.accountForm.invalid) { this.accountForm.markAllAsTouched(); return; }
    const value = this.accountForm.getRawValue();
    this.savingAccount.set(true);
    this.store.updateAccount({ firstName: value.firstName.trim(), lastName: value.lastName.trim() || null, email: value.email.trim().toLowerCase(), ...(value.currentPassword ? { currentPassword: value.currentPassword } : {}) }).pipe(
      finalize(() => this.savingAccount.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => { this.accountForm.controls.currentPassword.reset(''); this.accountForm.markAsPristine(); this.notice.set({ tone: 'success', text: 'Account aggiornato.' }); },
      error: (error: unknown) => this.notice.set({ tone: 'danger', text: apiErrorMessage(error) }),
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid || this.passwordMismatch()) { this.passwordForm.markAllAsTouched(); return; }
    this.savingPassword.set(true);
    this.store.changePassword(this.passwordForm.getRawValue()).pipe(
      finalize(() => this.savingPassword.set(false)), takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => { this.authState.clearSession(); void this.router.navigate(['/auth/login'], { queryParams: { passwordChanged: 'true' } }); },
      error: (error: unknown) => this.notice.set({ tone: 'danger', text: apiErrorMessage(error) }),
    });
  }

  revokeOtherSessions(): void {
    this.revoking.set(true);
    this.store.revokeOtherSessions().pipe(finalize(() => this.revoking.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (result) => this.notice.set({ tone: 'success', text: `${result.revokedCount} ${result.revokedCount === 1 ? 'sessione revocata' : 'sessioni revocate'}.` }),
      error: (error: unknown) => this.notice.set({ tone: 'danger', text: apiErrorMessage(error) }),
    });
  }
}
