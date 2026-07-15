import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../../../environments/environment';
import { AuthStateService } from '../auth-state.service';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(environment.apiBaseUrl)) {
    return next(request);
  }

  const token = inject(AuthStateService).accessToken();
  const authenticatedRequest = request.clone({
    withCredentials: true,
    ...(token
      ? { setHeaders: { Authorization: `Bearer ${token}` } }
      : {})
  });

  return next(authenticatedRequest);
};
