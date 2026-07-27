import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';

import { AuthStateService } from '../auth-state.service';

export const guestGuard: CanActivateFn = () => {
  const authState = inject(AuthStateService);
  const router = inject(Router);
  const decide = () => authState.authenticated()
    ? router.createUrlTree(['/dashboard'])
    : true;

  if (authState.initialized()) return decide();

  return toObservable(authState.initialized).pipe(
    filter(Boolean),
    take(1),
    map(decide)
  );
};
