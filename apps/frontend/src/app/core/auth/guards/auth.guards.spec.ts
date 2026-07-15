import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';

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

  it('reindirizza il guest che apre una rotta protetta', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard(
        {} as ActivatedRouteSnapshot,
        { url: '/dashboard' } as RouterStateSnapshot
      )
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toContain('/auth/login');
  });

  it('consente la dashboard all’utente autenticato e blocca le pagine guest', () => {
    TestBed.inject(AuthStateService).setSession(session);
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
