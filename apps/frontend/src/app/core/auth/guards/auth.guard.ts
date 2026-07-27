import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';

import { AuthStateService } from '../auth-state.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  const decide = () => authState.authenticated()
    ? true
    : router.createUrlTree(['/auth/login'], {
        queryParams: { returnUrl: state.url }
      });

  if (authState.initialized()) return decide();

  return toObservable(authState.initialized).pipe(
    filter(Boolean),
    take(1),
    map(decide)
  );
};
