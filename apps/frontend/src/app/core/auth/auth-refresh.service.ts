import { HttpBackend, HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { finalize, map, Observable, shareReplay, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiEnvelope, AuthResponse } from './auth.models';
import { AuthStateService } from './auth-state.service';

@Injectable({ providedIn: 'root' })
export class AuthRefreshService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly state = inject(AuthStateService);
  private refreshRequest: Observable<AuthResponse> | null = null;

  refresh(): Observable<AuthResponse> {
    if (this.refreshRequest) {
      return this.refreshRequest;
    }

    this.refreshRequest = this.http
      .post<ApiEnvelope<AuthResponse>>(
        `${environment.apiBaseUrl}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .pipe(
        map((response) => response.data),
        tap((session) => this.state.setSession(session)),
        finalize(() => {
          this.refreshRequest = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      );

    return this.refreshRequest;
  }
}
