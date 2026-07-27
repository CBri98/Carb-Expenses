import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ExpenseStatus,
  PaymentMethod,
  Prisma,
  RecurrenceFrequency,
  RecurrenceStatus,
  ReminderType,
} from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../src/prisma/prisma.service';
import { RecurrenceUpdateScope } from '../src/recurrences/dto/recurrence.dto';
import { RecurrenceCalculatorService } from '../src/recurrences/recurrence-calculator.service';
import { RecurrenceGeneratorService } from '../src/recurrences/recurrence-generator.service';
import { RecurrencesService } from '../src/recurrences/recurrences.service';
import type { RecurrenceWithRelations } from '../src/recurrences/recurrences.types';

const now = new Date('2026-07-18T10:00:00.000Z');
const ruleId = '70000000-0000-4000-8000-000000000001';
const categoryId = '10000000-0000-4000-8000-000000000001';
const labelId = '20000000-0000-4000-8000-000000000001';

describe('RecurrencesService', () => {
  let prisma: ReturnType<typeof prismaMock>;
  let generator: { generateRule: ReturnType<typeof vi.fn> };
  let service: RecurrencesService;

  beforeEach(() => {
    prisma = prismaMock();
    generator = { generateRule: vi.fn().mockResolvedValue(generationResult()) };
    prisma.category.findFirst.mockResolvedValue({
      id: categoryId,
      isActive: true,
      preferences: [],
    });
    prisma.label.count.mockResolvedValue(1);
    prisma.recurrenceRule.create.mockResolvedValue(recurrenceRule());
    prisma.recurrenceRule.findFirst.mockResolvedValue(recurrenceRule());
    prisma.recurrenceRule.update.mockResolvedValue(recurrenceRule());
    prisma.user.findUniqueOrThrow.mockResolvedValue({ timezone: 'Europe/Rome' });
    prisma.expense.findMany.mockResolvedValue([]);
    service = new RecurrencesService(
      prisma as unknown as PrismaService,
      new RecurrenceCalculatorService(),
      generator as unknown as RecurrenceGeneratorService,
      {
        get: vi.fn((_key: string, fallback: string | number) => fallback),
      } as unknown as ConfigService,
    );
  });

  it('crea una regola owned, relazioni e template, quindi genera il suo orizzonte', async () => {
    const result = await service.create('user-1', {
      name: 'Affitto',
      description: 'Affitto mensile',
      amount: '850.00',
      categoryId,
      labelIds: [labelId],
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      startDate: '2026-08-01',
      generateDaysAhead: 60,
      reminderTemplates: [{ type: ReminderType.THREE_DAYS_BEFORE }],
    }, now);

    expect(result.id).toBe(ruleId);
    expect(prisma.recurrenceRule.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'user-1',
        categoryId,
        name: 'Affitto',
        description: 'Affitto',
        startDate: new Date('2026-08-01T00:00:00.000Z'),
        labels: { create: [{ labelId }] },
        reminderTemplates: {
          create: [{
            type: ReminderType.THREE_DAYS_BEFORE,
            offsetMinutes: 4_320,
            reminderTime: null,
          }],
        },
      }),
    }));
    expect(generator.generateRule).toHaveBeenCalledWith(ruleId, now, 500);
  });

  it('non espone regole altrui', async () => {
    prisma.recurrenceRule.findFirst.mockResolvedValue(null);
    await expect(service.findOne('other-user', ruleId)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.recurrenceRule.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: ruleId, userId: 'other-user', deletedAt: null },
    }));
  });

  it('impedisce di spostare la data iniziale dopo la prima generazione', async () => {
    prisma.recurrenceRule.findFirst.mockResolvedValue(recurrenceRule({ generatedCount: 2 }));
    await expect(service.update('user-1', ruleId, {
      startDate: '2026-09-01',
      updateScope: RecurrenceUpdateScope.RULE_ONLY,
    }, now)).rejects.toBeInstanceOf(ConflictException);
  });

  it('aggiorna soltanto future PLANNED quando viene richiesto lo scope bulk', async () => {
    prisma.recurrenceRule.findFirst.mockResolvedValue(recurrenceRule({ generatedCount: 2 }));
    prisma.expense.findMany.mockResolvedValue([
      {
        id: 'expense-future',
        expenseDate: new Date('2026-08-01T00:00:00.000Z'),
        expenseTime: null,
      },
    ]);
    await service.update('user-1', ruleId, {
      amount: '900.00',
      updateScope: RecurrenceUpdateScope.RULE_AND_FUTURE_PLANNED_EXPENSES,
    }, now);

    expect(prisma.expense.findMany).toHaveBeenCalledWith({
      where: {
        recurrenceRuleId: ruleId,
        status: ExpenseStatus.PLANNED,
        deletedAt: null,
        expenseDate: { gte: new Date('2026-07-18T00:00:00.000Z') },
      },
      select: { id: true, expenseDate: true, expenseTime: true },
    });
    expect(prisma.expense.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['expense-future'] } },
      data: expect.objectContaining({ amount: new Prisma.Decimal('900.00') }),
    });
  });

  it('mantiene description sincronizzata al nome nella regola e nelle future pianificate', async () => {
    prisma.recurrenceRule.findFirst.mockResolvedValue(recurrenceRule({ generatedCount: 2 }));
    prisma.expense.findMany.mockResolvedValue([{ id: 'expense-future', expenseDate: new Date('2026-08-01T00:00:00.000Z'), expenseTime: null }]);
    await service.update('user-1', ruleId, {
      name: 'Affitto nuova casa',
      description: 'Valore legacy ignorato',
      updateScope: RecurrenceUpdateScope.RULE_AND_FUTURE_PLANNED_EXPENSES,
    }, now);

    expect(prisma.recurrenceRule.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ name: 'Affitto nuova casa', description: 'Affitto nuova casa' }),
    }));
    expect(prisma.expense.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ description: 'Affitto nuova casa' }),
    }));
  });

  it('riprende una mensile dalla prima data futura senza arretrati', async () => {
    prisma.recurrenceRule.findFirst.mockResolvedValue(recurrenceRule({
      status: RecurrenceStatus.PAUSED,
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      nextOccurrenceDate: new Date('2026-02-01T00:00:00.000Z'),
    }));
    await service.resume('user-1', ruleId, now);
    expect(prisma.recurrenceRule.update).toHaveBeenCalledWith({
      where: { id: ruleId },
      data: expect.objectContaining({
        status: RecurrenceStatus.ACTIVE,
        nextOccurrenceDate: new Date('2026-08-01T00:00:00.000Z'),
      }),
    });
    expect(generator.generateRule).toHaveBeenCalledWith(ruleId, now, 500);
  });

  it('la terminazione opzionale seleziona solo future PLANNED e disattiva i promemoria', async () => {
    prisma.expense.findMany.mockResolvedValue([{ id: 'expense-future' }]);
    await service.cancel('user-1', ruleId, { cancelFutureExpenses: true }, now);
    expect(prisma.expense.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['expense-future'] }, status: ExpenseStatus.PLANNED },
      data: { status: ExpenseStatus.CANCELLED },
    });
    expect(prisma.expenseReminder.updateMany).toHaveBeenCalledWith({
      where: {
        expenseId: { in: ['expense-future'] },
        isActive: true,
        processedAt: null,
      },
      data: { isActive: false, cancelledAt: now },
    });
  });
});

function recurrenceRule(
  overrides: Partial<RecurrenceWithRelations> = {},
): RecurrenceWithRelations {
  const timestamp = new Date('2026-07-01T08:00:00.000Z');
  return {
    id: ruleId,
    userId: 'user-1',
    categoryId,
    name: 'Affitto',
    description: 'Affitto mensile',
    amount: new Prisma.Decimal('850.00'),
    merchant: null,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    notes: null,
    frequency: RecurrenceFrequency.MONTHLY,
    interval: 1,
    status: RecurrenceStatus.ACTIVE,
    startDate: new Date('2026-08-01T00:00:00.000Z'),
    endDate: null,
    nextOccurrenceDate: new Date('2026-08-01T00:00:00.000Z'),
    lastGeneratedDate: null,
    maxOccurrences: null,
    generatedCount: 0,
    expenseTime: null,
    generateDaysAhead: 30,
    pausedAt: null,
    completedAt: null,
    cancelledAt: null,
    generationVersion: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    category: {
      id: categoryId,
      userId: null,
      name: 'Affitto',
      description: null,
      slug: 'affitto',
      icon: 'bi-house',
      color: '#4F46E5',
      sortOrder: 1,
      isDefault: true,
      isActive: true,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    },
    labels: [],
    reminderTemplates: [],
    exceptions: [],
    _count: { expenses: 0 },
    ...overrides,
  };
}

function generationResult() {
  return {
    processedRules: 1,
    generatedExpenses: 1,
    completedRules: 0,
    skippedExisting: 0,
    skippedExceptions: 0,
    errors: 0,
  };
}

function prismaMock() {
  const mock = {
    category: { findFirst: vi.fn() },
    label: { count: vi.fn() },
    recurrenceRule: {
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    user: { findUniqueOrThrow: vi.fn() },
    expense: {
      findMany: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    expenseLabel: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    expenseReminder: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  mock.$transaction.mockImplementation(async (input) =>
    typeof input === 'function' ? input(mock) : Promise.all(input),
  );
  return mock;
}
