import { computed, Injectable, signal } from '@angular/core';

import type { AuthResponse, AuthUser } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly accessTokenState = signal<string | null>(null);
  private readonly userState = signal<AuthUser | null>(null);
  private readonly initializedState = signal(false);

  readonly accessToken = this.accessTokenState.asReadonly();
  readonly user = this.userState.asReadonly();
  readonly initialized = this.initializedState.asReadonly();
  readonly authenticated = computed(
    () => this.accessTokenState() !== null && this.userState() !== null
  );

  setSession(session: AuthResponse): void {
    this.accessTokenState.set(session.accessToken);
    this.userState.set(session.user);
  }

  clearSession(): void {
    this.accessTokenState.set(null);
    this.userState.set(null);
  }

  markInitialized(): void {
    this.initializedState.set(true);
  }
}
