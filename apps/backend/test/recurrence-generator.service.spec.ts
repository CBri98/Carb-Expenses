import { ConfigService } from '@nestjs/config';
import {
  ExpenseStatus,
  PaymentMethod,
  RecurrenceFrequency,
  RecurrenceStatus,
  ReminderType,
} from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../src/prisma/prisma.service';
import { RecurrenceCalculatorService } from '../src/recurrences/recurrence-calculator.service';
import { RecurrenceGeneratorService } from '../src/recurrences/recurrence-generator.service';

const now = new Date('2026-07-18T08:00:00.000Z');
const startDate = new Date('2026-07-20T00:00:00.000Z');
const rule = {
  id: '70000000-0000-4000-8000-000000000001',
  userId: 'user-1',
  categoryId: '10000000-0000-4000-8000-000000000001',
  name: 'Affitto',
  description: 'Affitto mensile',
  amount: { toString: () => '850.00' },
  merchant: null,
  paymentMethod: PaymentMethod.BANK_TRANSFER,
  notes: null,
  frequency: RecurrenceFrequency.MONTHLY,
  interval: 1,
  status: RecurrenceStatus.ACTIVE,
  startDate,
  endDate: null,
  nextOccurrenceDate: startDate,
  lastGeneratedDate: null,
  maxOccurrences: null,
  generatedCount: 0,
  expenseTime: new Date('1970-01-01T09:00:00.000Z'),
  generateDaysAhead: 30,
  generationVersion: 0,
  user: { timezone: 'Europe/Rome' },
  labels: [{ labelId: '20000000-0000-4000-8000-000000000001' }],
  reminderTemplates: [{
    type: ReminderType.THREE_DAYS_BEFORE,
    offsetMinutes: 4_320,
    reminderTime: new Date('1970-01-01T09:00:00.000Z'),
  }],
  exceptions: [],
};

describe('RecurrenceGeneratorService', () => {
  let prisma: ReturnType<typeof prismaMock>;
  let service: RecurrenceGeneratorService;

  beforeEach(() => {
    prisma = prismaMock();
    prisma.recurrenceRule.findFirst.mockResolvedValue(rule);
    prisma.recurrenceRule.updateMany.mockResolvedValue({ count: 1 });
    prisma.recurrenceRule.findUniqueOrThrow.mockResolvedValue(rule);
    prisma.expense.aggregate.mockResolvedValue({
      _count: { _all: 0 },
      _max: { occurrenceDate: null },
    });
    prisma.expense.createMany.mockResolvedValue({ count: 1 });
    prisma.expense.findUniqueOrThrow.mockResolvedValue({ id: 'expense-1' });
    prisma.expenseLabel.createMany.mockResolvedValue({ count: 1 });
    prisma.expenseReminder.createMany.mockResolvedValue({ count: 1 });
    prisma.recurrenceRule.update.mockResolvedValue(rule);
    service = new RecurrenceGeneratorService(
      prisma as unknown as PrismaService,
      new RecurrenceCalculatorService(),
      { get: vi.fn((_key: string, fallback: unknown) => fallback) } as unknown as ConfigService,
    );
  });

  it('genera una normale spesa PLANNED copiando etichette e promemoria', async () => {
    const result = await service.generateRule(rule.id, now, 1);
    expect(result.generatedExpenses).toBe(1);
    expect(prisma.expense.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({
        description: rule.name,
        status: ExpenseStatus.PLANNED,
        recurrenceRuleId: rule.id,
        occurrenceDate: startDate,
        generatedByRecurrence: true,
      })],
      skipDuplicates: true,
    });
    expect(prisma.expenseLabel.createMany).toHaveBeenCalledWith({
      data: [{ expenseId: 'expense-1', labelId: rule.labels[0].labelId }],
      skipDuplicates: true,
    });
    expect(prisma.expenseReminder.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({
        expenseId: 'expense-1',
        type: ReminderType.THREE_DAYS_BEFORE,
        scheduledAt: new Date('2026-07-17T07:00:00.000Z'),
      })],
      skipDuplicates: true,
    });
  });

  it('il vincolo createMany skipDuplicates rende idempotente una occorrenza esistente', async () => {
    prisma.expense.aggregate.mockResolvedValue({
      _count: { _all: 1 },
      _max: { occurrenceDate: startDate },
    });
    prisma.expense.createMany.mockResolvedValue({ count: 0 });
    const result = await service.generateRule(rule.id, now, 1);
    expect(result.generatedExpenses).toBe(0);
    expect(result.skippedExisting).toBe(1);
    expect(prisma.expenseLabel.createMany).not.toHaveBeenCalled();
  });

  it('un claim concorrente già acquisito non genera nulla', async () => {
    prisma.recurrenceRule.updateMany.mockResolvedValue({ count: 0 });
    const result = await service.generateRule(rule.id, now);
    expect(result.processedRules).toBe(0);
    expect(prisma.expense.createMany).not.toHaveBeenCalled();
  });

  it('un record soft deleted continua a bloccare la rigenerazione', async () => {
    prisma.expense.aggregate.mockResolvedValue({
      _count: { _all: 1 },
      _max: { occurrenceDate: startDate },
    });
    prisma.expense.createMany.mockResolvedValue({ count: 0 });
    await service.generateRule(rule.id, now, 1);
    expect(prisma.expense.createMany).toHaveBeenCalledWith(
      expect.objectContaining({ skipDuplicates: true }),
    );
  });

  it('non elabora regole senza occorrenze entro il loro orizzonte', async () => {
    prisma.recurrenceRule.findFirst.mockResolvedValue({
      ...rule,
      nextOccurrenceDate: new Date('2027-07-20T00:00:00.000Z'),
    });
    const result = await service.generateRule(rule.id, now);
    expect(result.processedRules).toBe(0);
    expect(prisma.recurrenceRule.updateMany).not.toHaveBeenCalled();
  });

  it('genera più occorrenze nell’orizzonte e completa al limite massimo', async () => {
    const finiteRule = {
      ...rule,
      frequency: RecurrenceFrequency.DAILY,
      maxOccurrences: 3,
    };
    prisma.recurrenceRule.findFirst.mockResolvedValue(finiteRule);
    prisma.recurrenceRule.findUniqueOrThrow.mockResolvedValue(finiteRule);
    const result = await service.generateRule(rule.id, now, 10);
    expect(result).toMatchObject({ generatedExpenses: 3, completedRules: 1 });
    expect(prisma.expense.createMany).toHaveBeenCalledTimes(3);
    expect(prisma.recurrenceRule.update).toHaveBeenCalledWith({
      where: { id: rule.id },
      data: expect.objectContaining({
        generatedCount: 3,
        nextOccurrenceDate: null,
        status: RecurrenceStatus.COMPLETED,
      }),
    });
  });

  it('salta le eccezioni senza creare una spesa parallela', async () => {
    const exceptedRule = {
      ...rule,
      frequency: RecurrenceFrequency.DAILY,
      exceptions: [{ occurrenceDate: startDate }],
    };
    prisma.recurrenceRule.findFirst.mockResolvedValue(exceptedRule);
    prisma.recurrenceRule.findUniqueOrThrow.mockResolvedValue(exceptedRule);
    const result = await service.generateRule(rule.id, now, 1);
    expect(result.skippedExceptions).toBe(1);
    expect(prisma.expense.createMany).not.toHaveBeenCalled();
  });
});

function prismaMock() {
  const mock = {
    recurrenceRule: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
    expense: {
      aggregate: vi.fn(),
      createMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
    },
    expenseLabel: { createMany: vi.fn() },
    expenseReminder: { createMany: vi.fn() },
    $transaction: vi.fn(),
  };
  mock.$transaction.mockImplementation(async (callback) => callback(mock));
  return mock;
}
