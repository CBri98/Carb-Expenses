import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiEnvelope } from '../auth/auth.models';
import type {
  CalendarExpenseEvent,
  CalendarEventsQuery,
} from '../../shared/models/calendar.models';

@Injectable({ providedIn: 'root' })
export class CalendarService {
  private readonly http = inject(HttpClient);

  expenses(query: CalendarEventsQuery): Observable<CalendarExpenseEvent[]> {
    return this.http
      .get<ApiEnvelope<CalendarExpenseEvent[]>>(
        `${environment.apiBaseUrl}/calendar/expenses`,
        { params: calendarParams(query) },
      )
      .pipe(map((response) => response.data));
  }
}

function calendarParams(query: CalendarEventsQuery): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) continue;
    params = params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  return params;
}
