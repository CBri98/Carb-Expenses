import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { concat, defaultIfEmpty, map, Observable, of, toArray } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiEnvelope } from '../auth/auth.models';
import type {
  CreateExpenseReminderRequest,
  ExpenseReminder,
  ReminderDraft,
  UpdateExpenseReminderRequest,
} from '../../shared/models/notification.models';

@Injectable({ providedIn: 'root' })
export class ExpenseReminderService {
  private readonly http = inject(HttpClient);

  list(expenseId: string): Observable<ExpenseReminder[]> {
    return this.http
      .get<ApiEnvelope<ExpenseReminder[]>>(
        `${environment.apiBaseUrl}/expenses/${expenseId}/reminders`,
      )
      .pipe(map((response) => response.data));
  }

  create(expenseId: string, request: CreateExpenseReminderRequest): Observable<ExpenseReminder> {
    return this.http
      .post<ApiEnvelope<ExpenseReminder>>(
        `${environment.apiBaseUrl}/expenses/${expenseId}/reminders`,
        request,
      )
      .pipe(map((response) => response.data));
  }

  update(
    expenseId: string,
    reminderId: string,
    request: UpdateExpenseReminderRequest,
  ): Observable<ExpenseReminder> {
    return this.http
      .patch<ApiEnvelope<ExpenseReminder>>(
        `${environment.apiBaseUrl}/expenses/${expenseId}/reminders/${reminderId}`,
        request,
      )
      .pipe(map((response) => response.data));
  }

  remove(expenseId: string, reminderId: string): Observable<void> {
    return this.http
      .delete<void>(`${environment.apiBaseUrl}/expenses/${expenseId}/reminders/${reminderId}`)
      .pipe(map(() => undefined));
  }

  sync(
    expenseId: string,
    existing: readonly ExpenseReminder[],
    drafts: readonly ReminderDraft[],
  ): Observable<ExpenseReminder[]> {
    const editable = existing.filter((reminder) => reminder.isActive && !reminder.processedAt);
    const retainedIds = new Set<string>();
    const operations: Observable<ExpenseReminder | null>[] = [];

    for (const draft of drafts) {
      const match = editable.find(
        (reminder) =>
          !retainedIds.has(reminder.id) &&
          reminder.type === draft.type &&
          (draft.type !== 'CUSTOM' || sameInstant(reminder.scheduledAt, draft.scheduledAt)),
      );
      if (match) {
        retainedIds.add(match.id);
        continue;
      }
      const custom = draft.type === 'CUSTOM'
        ? editable.find((reminder) => !retainedIds.has(reminder.id) && reminder.type === 'CUSTOM')
        : undefined;
      if (custom) {
        retainedIds.add(custom.id);
        operations.push(this.update(expenseId, custom.id, draft));
      } else {
        operations.push(this.create(expenseId, draft));
      }
    }
    for (const reminder of editable) {
      if (!retainedIds.has(reminder.id)) {
        operations.unshift(this.remove(expenseId, reminder.id).pipe(map(() => null)));
      }
    }

    if (operations.length === 0) return of([...existing]);
    return concat(...operations).pipe(
      toArray(),
      defaultIfEmpty([]),
      map(() => []),
    );
  }
}

function sameInstant(left: string, right?: string): boolean {
  return right !== undefined && new Date(left).getTime() === new Date(right).getTime();
}
