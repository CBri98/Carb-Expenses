import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AuthRefreshService } from '../auth-refresh.service';
import { AuthStateService } from '../auth-state.service';

const NON_RETRYABLE_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout'
];

export const authRefreshInterceptor: HttpInterceptorFn = (request, next) => {
  const refreshService = inject(AuthRefreshService);
  const state = inject(AuthStateService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!shouldRefresh(request.url, error)) {
        return throwError(() => error);
      }

      return refreshService.refresh().pipe(
        switchMap((session) =>
          next(
            request.clone({
              withCredentials: true,
              setHeaders: { Authorization: `Bearer ${session.accessToken}` }
            })
          )
        ),
        catchError((refreshError: unknown) => {
          state.clearSession();
          void router.navigate(['/auth/login'], {
            queryParams: { sessionExpired: true }
          });
          return throwError(() => refreshError);
        })
      );
    })
  );
};

function shouldRefresh(url: string, error: unknown): boolean {
  return (
    error instanceof HttpErrorResponse &&
    error.status === 401 &&
    url.startsWith(environment.apiBaseUrl) &&
    !NON_RETRYABLE_AUTH_PATHS.some((path) => url.endsWith(path))
  );
}
