import { HttpErrorResponse } from '@angular/common/http';

interface ErrorPayload {
  message?: unknown;
}

export function apiErrorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse && isErrorPayload(error.error)) {
    if (typeof error.error.message === 'string' && error.error.message.trim()) {
      return error.error.message;
    }
  }
  return 'Non è stato possibile completare l’operazione. Riprova.';
}

function isErrorPayload(value: unknown): value is ErrorPayload {
  return typeof value === 'object' && value !== null;
}
