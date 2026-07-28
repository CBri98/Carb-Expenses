import {
  ExpenseStatus,
  NotificationStatus,
  NotificationType,
  PaymentMethod,
  Prisma,
  ReminderSource,
  ReminderType,
} from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { ReminderDerivedStatus } from '../src/reminders/dto/reminder.dto';
import type { ReminderWithRelations } from '../src/reminders/reminders.types';
import { allowedActions, derivedStatus } from '../src/reminders/reminders.utils';

const now = new Date('2026-07-28T10:00:00.000Z');

describe('stato derivato dei promemoria', () => {
  it.each([
    ['ACTIVE', { scheduledAt: new Date('2026-08-20T10:00:00.000Z') }, ReminderDerivedStatus.ACTIVE],
    ['UPCOMING', { scheduledAt: new Date('2026-08-01T10:00:00.000Z') }, ReminderDerivedStatus.UPCOMING],
    ['DUE', { scheduledAt: new Date('2026-07-28T09:00:00.000Z') }, ReminderDerivedStatus.DUE],
    ['PROCESSED', { processedAt: now }, ReminderDerivedStatus.PROCESSED],
    ['CANCELLED', { isActive: false, cancelledAt: now }, ReminderDerivedStatus.CANCELLED],
    ['COMPLETED expense', { expense: { status: ExpenseStatus.COMPLETED } }, ReminderDerivedStatus.INVALID],
    ['CANCELLED expense', { expense: { status: ExpenseStatus.CANCELLED } }, ReminderDerivedStatus.INVALID],
    ['deleted expense', { expense: { deletedAt: now } }, ReminderDerivedStatus.INVALID],
  ])('riconosce %s', (_label, overrides, expected) => {
    expect(derivedStatus(reminder(overrides), now)).toBe(expected);
  });

  it('espone le azioni solo quando il backend può realmente eseguirle', () => {
    expect(allowedActions(reminder(), now)).toEqual({
      canEdit: true,
      canCancel: true,
      canReactivate: false,
      canDelete: true,
    });
    expect(allowedActions(reminder({ isActive: false, cancelledAt: now }), now).canReactivate).toBe(true);
    expect(allowedActions(reminder({ source: ReminderSource.RECURRENCE }), now).canDelete).toBe(false);
    expect(allowedActions(reminder({ notifications: [notification()] }), now).canDelete).toBe(false);
    expect(allowedActions(reminder({ processedAt: now }), now).canEdit).toBe(false);
  });
});

function reminder(overrides: Record<string, unknown> = {}): ReminderWithRelations {
  const base: ReminderWithRelations = {
    id: '50000000-0000-4000-8000-000000000001',
    userId: 'user-1',
    expenseId: '40000000-0000-4000-8000-000000000001',
    type: ReminderType.THREE_DAYS_BEFORE,
    source: ReminderSource.MANUAL,
    offsetMinutes: 4_320,
    scheduledAt: new Date('2026-08-10T10:00:00.000Z'),
    isActive: true,
    processedAt: null,
    cancelledAt: null,
    createdAt: now,
    updatedAt: now,
    notifications: [],
    expense: {
      id: '40000000-0000-4000-8000-000000000001',
      userId: 'user-1',
      categoryId: '10000000-0000-4000-8000-000000000001',
      description: 'Assicurazione auto',
      amount: new Prisma.Decimal('320.00'),
      expenseDate: new Date('2026-08-13T00:00:00.000Z'),
      expenseTime: null,
      merchant: null,
      paymentMethod: PaymentMethod.DIRECT_DEBIT,
      notes: null,
      status: ExpenseStatus.PLANNED,
      overdueNotifiedForDate: null,
      recurrenceRuleId: null,
      occurrenceDate: null,
      generatedByRecurrence: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      category: {
        id: '10000000-0000-4000-8000-000000000001',
        userId: null,
        name: 'Auto',
        slug: 'auto',
        description: null,
        icon: 'bi-car-front',
        color: '#2563EB',
        sortOrder: 1,
        isDefault: true,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      labels: [],
      recurrenceRule: null,
    },
  };
  const expenseOverride = overrides['expense'] as Partial<ReminderWithRelations['expense']> | undefined;
  return {
    ...base,
    ...overrides,
    expense: { ...base.expense, ...expenseOverride },
  } as ReminderWithRelations;
}

function notification(): ReminderWithRelations['notifications'][number] {
  return {
    id: '60000000-0000-4000-8000-000000000001',
    userId: 'user-1',
    expenseId: '40000000-0000-4000-8000-000000000001',
    reminderId: '50000000-0000-4000-8000-000000000001',
    type: NotificationType.EXPENSE_REMINDER,
    status: NotificationStatus.UNREAD,
    title: 'Promemoria',
    message: 'Messaggio',
    scheduledAt: now,
    deduplicationKey: 'key',
    readAt: null,
    archivedAt: null,
    createdAt: now,
  };
}
