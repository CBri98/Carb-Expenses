import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { firstValueFrom, isObservable, type Observable } from 'rxjs';

import type { AuthResponse } from '../auth.models';
import { AuthStateService } from '../auth-state.service';
import { authGuard } from './auth.guard';
import { guestGuard } from './guest.guard';

const session: AuthResponse = {
  accessToken: 'access-token',
  user: {
    id: 'user-1',
    email: 'utente@example.com',
    firstName: 'Utente',
    lastName: null,
    currency: 'EUR',
    timezone: 'Europe/Rome',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
};

describe('Auth guards', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('attende l’inizializzazione prima di reindirizzare il guest', async () => {
    const authState = TestBed.inject(AuthStateService);
    const result = TestBed.runInInjectionContext(() =>
      authGuard(
        {} as ActivatedRouteSnapshot,
        { url: '/calendar?view=week&date=2026-07-18' } as RouterStateSnapshot
      )
    );

    expect(isObservable(result)).toBe(true);
    authState.markInitialized();
    const decision = await firstValueFrom(result as Observable<boolean | UrlTree>);

    expect(decision).toBeInstanceOf(UrlTree);
    expect((decision as UrlTree).toString()).toContain(
      'returnUrl=%2Fcalendar%3Fview%3Dweek%26date%3D2026-07-18'
    );
  });

  it('mantiene la route richiesta quando il refresh completa la sessione', async () => {
    const authState = TestBed.inject(AuthStateService);
    const protectedResult = TestBed.runInInjectionContext(() =>
      authGuard(
        {} as ActivatedRouteSnapshot,
        { url: '/calendar?view=week&date=2026-07-18' } as RouterStateSnapshot
      )
    );

    expect(isObservable(protectedResult)).toBe(true);
    authState.setSession(session);
    authState.markInitialized();
    await expect(
      firstValueFrom(protectedResult as Observable<boolean | UrlTree>)
    ).resolves.toBe(true);
  });

  it('consente la dashboard all’utente autenticato e blocca le pagine guest', () => {
    const authState = TestBed.inject(AuthStateService);
    authState.setSession(session);
    authState.markInitialized();
    const protectedResult = TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url: '/dashboard' } as RouterStateSnapshot)
    );
    const guestResult = TestBed.runInInjectionContext(() =>
      guestGuard({} as ActivatedRouteSnapshot, { url: '/auth/login' } as RouterStateSnapshot)
    );

    expect(protectedResult).toBe(true);
    expect(guestResult).toBeInstanceOf(UrlTree);
    expect((guestResult as UrlTree).toString()).toBe('/dashboard');
  });
});
