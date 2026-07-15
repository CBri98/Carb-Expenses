import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import type { ApiEnvelope, AuthResponse } from './auth.models';
import { AuthService } from './auth.service';
import { AuthStateService } from './auth-state.service';

const session: AuthResponse = {
  accessToken: 'access-token',
  user: {
    id: 'user-1',
    email: 'utente@example.com',
    firstName: 'Mario',
    lastName: 'Rossi',
    currency: 'EUR',
    timezone: 'Europe/Rome',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
};

function envelope<T>(data: T): ApiEnvelope<T> {
  return { data, meta: {}, message: 'Operazione completata' };
}

describe('AuthService', () => {
  let service: AuthService;
  let state: AuthStateService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    state = TestBed.inject(AuthStateService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('salva in memoria utente e access token dopo il login', () => {
    service.login({ email: 'utente@example.com', password: 'Password1' }).subscribe();
    const request = http.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(request.request.withCredentials).toBe(true);
    request.flush(envelope(session));

    expect(state.authenticated()).toBe(true);
    expect(state.user()?.email).toBe('utente@example.com');
    expect(state.accessToken()).toBe('access-token');
  });

  it('pulisce sempre lo stato al logout', () => {
    state.setSession(session);
    service.logout().subscribe();
    const request = http.expectOne(`${environment.apiBaseUrl}/auth/logout`);
    request.flush(envelope({ loggedOut: true as const }));

    expect(state.authenticated()).toBe(false);
    expect(state.accessToken()).toBeNull();
  });

  it('gestisce un refresh scaduto durante il ripristino iniziale', () => {
    service.restoreSession().subscribe();
    const request = http.expectOne(`${environment.apiBaseUrl}/auth/refresh`);
    request.flush(
      { statusCode: 401, message: 'Refresh token scaduto' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(state.initialized()).toBe(true);
    expect(state.authenticated()).toBe(false);
  });

  it('conferma la sessione ripristinata tramite /auth/me', () => {
    service.restoreSession().subscribe();
    http
      .expectOne(`${environment.apiBaseUrl}/auth/refresh`)
      .flush(envelope(session));
    http
      .expectOne(`${environment.apiBaseUrl}/auth/me`)
      .flush(envelope(session.user));

    expect(state.initialized()).toBe(true);
    expect(state.authenticated()).toBe(true);
  });
});
