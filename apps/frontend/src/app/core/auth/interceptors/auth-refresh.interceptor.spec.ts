import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { environment } from '../../../../environments/environment';
import type { ApiEnvelope, AuthResponse, AuthUser } from '../auth.models';
import { AuthStateService } from '../auth-state.service';
import { authRefreshInterceptor } from './auth-refresh.interceptor';
import { authTokenInterceptor } from './auth-token.interceptor';

const user: AuthUser = {
  id: 'user-1',
  email: 'utente@example.com',
  firstName: 'Utente',
  lastName: null,
  currency: 'EUR',
  timezone: 'Europe/Rome',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z'
};

function envelope<T>(data: T): ApiEnvelope<T> {
  return { data, meta: {}, message: 'Operazione completata' };
}

describe('authRefreshInterceptor', () => {
  it('ruota il token su 401 e ripete la richiesta una sola volta', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(
          withInterceptors([authTokenInterceptor, authRefreshInterceptor])
        ),
        provideHttpClientTesting()
      ]
    });
    const http = TestBed.inject(HttpClient);
    const controller = TestBed.inject(HttpTestingController);
    const state = TestBed.inject(AuthStateService);
    state.setSession({ user, accessToken: 'old-token' });

    http
      .get<ApiEnvelope<AuthUser>>(`${environment.apiBaseUrl}/auth/me`)
      .subscribe((response) => expect(response.data.email).toBe(user.email));

    const expired = controller.expectOne(`${environment.apiBaseUrl}/auth/me`);
    expect(expired.request.headers.get('Authorization')).toBe('Bearer old-token');
    expired.flush({}, { status: 401, statusText: 'Unauthorized' });

    const refresh = controller.expectOne(`${environment.apiBaseUrl}/auth/refresh`);
    const renewed: AuthResponse = { user, accessToken: 'new-token' };
    refresh.flush(envelope(renewed));

    const retry = controller.expectOne(`${environment.apiBaseUrl}/auth/me`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush(envelope(user));

    expect(state.accessToken()).toBe('new-token');
    controller.verify();
  });
});
