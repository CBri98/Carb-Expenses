import { HttpErrorResponse } from '@angular/common/http';

import type { ApiError } from './auth.models';

export function authErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const apiError = error.error as Partial<ApiError> | null;

    if (apiError && typeof apiError.message === 'string') {
      return apiError.message;
    }
  }

  return 'Non è stato possibile completare l’operazione. Riprova.';
}
