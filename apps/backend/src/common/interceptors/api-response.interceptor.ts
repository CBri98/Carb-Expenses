import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T | null;
  meta: Record<string, unknown>;
  message: string;
}

export interface ApiPayload<T> {
  data: T;
  meta?: Record<string, unknown>;
  message?: string;
}

@Injectable()
export class ApiResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((result) => {
        if (isApiPayload<T>(result)) {
          return {
            data: result.data,
            meta: result.meta ?? {},
            message: result.message ?? 'Operazione completata'
          };
        }
        return {
          data: result ?? null,
          meta: {},
          message: 'Operazione completata'
        };
      })
    );
  }
}

function isApiPayload<T>(value: unknown): value is ApiPayload<T> {
  return typeof value === 'object' && value !== null && 'data' in value;
}
