import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  switchMap,
  tap
} from 'rxjs';

import { environment } from '../../../environments/environment';
import type {
  ApiEnvelope,
  AuthResponse,
  LoginRequest,
  RegisterRequest
} from './auth.models';
import { AuthRefreshService } from './auth-refresh.service';
import { AuthStateService } from './auth-state.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly refreshService = inject(AuthRefreshService);
  readonly state = inject(AuthStateService);

  readonly user = this.state.user;
  readonly authenticated = this.state.authenticated;
  readonly initialized = this.state.initialized;

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.authenticate('register', request);
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.authenticate('login', request);
  }

  logout(): Observable<void> {
    return this.http
      .post<ApiEnvelope<{ loggedOut: true }>>(
        `${environment.apiBaseUrl}/auth/logout`,
        {},
        { withCredentials: true }
      )
      .pipe(
        map(() => undefined),
        catchError(() => of(undefined)),
        finalize(() => this.state.clearSession())
      );
  }

  restoreSession(): Observable<void> {
    if (!isPlatformBrowser(this.platformId)) {
      this.state.markInitialized();
      return of(undefined);
    }

    return this.refreshService.refresh().pipe(
      switchMap(() =>
        this.http.get<ApiEnvelope<AuthResponse['user']>>(
          `${environment.apiBaseUrl}/auth/me`
        )
      ),
      map(() => undefined),
      catchError(() => {
        this.state.clearSession();
        return of(undefined);
      }),
      finalize(() => this.state.markInitialized())
    );
  }

  private authenticate(
    endpoint: 'login' | 'register',
    request: LoginRequest | RegisterRequest
  ): Observable<AuthResponse> {
    return this.http
      .post<ApiEnvelope<AuthResponse>>(
        `${environment.apiBaseUrl}/auth/${endpoint}`,
        request,
        { withCredentials: true }
      )
      .pipe(
        map((response) => response.data),
        tap((session) => this.state.setSession(session))
      );
  }
}
