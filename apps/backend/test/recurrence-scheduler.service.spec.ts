import { ConfigService } from '@nestjs/config';
import { RecurrenceStatus } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../src/prisma/prisma.service';
import { RecurrenceGeneratorService } from '../src/recurrences/recurrence-generator.service';
import { RecurrenceSchedulerService } from '../src/recurrences/recurrence-scheduler.service';

const now = new Date('2026-07-18T10:00:00.000Z');

describe('RecurrenceSchedulerService', () => {
  let prisma: { recurrenceRule: { findMany: ReturnType<typeof vi.fn> } };
  let generator: { generateRule: ReturnType<typeof vi.fn> };
  let service: RecurrenceSchedulerService;

  beforeEach(() => {
    prisma = { recurrenceRule: { findMany: vi.fn().mockResolvedValue([]) } };
    generator = { generateRule: vi.fn() };
    const config = {
      get: vi.fn((key: string, fallback: number) =>
        key === 'MAX_RECURRENCE_GENERATION_DAYS_AHEAD' ? 365 : fallback,
      ),
    };
    service = new RecurrenceSchedulerService(
      prisma as unknown as PrismaService,
      generator as unknown as RecurrenceGeneratorService,
      config as unknown as ConfigService,
    );
  });

  it('interroga soltanto regole attive, non eliminate e nell’orizzonte massimo', async () => {
    await service.runCycle(now);
    expect(prisma.recurrenceRule.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        status: RecurrenceStatus.ACTIVE,
        deletedAt: null,
        nextOccurrenceDate: {
          not: null,
          lte: new Date('2027-07-18T00:00:00.000Z'),
        },
      },
      take: 100,
    }));
  });

  it('somma i risultati e continua dopo un errore isolato', async () => {
    prisma.recurrenceRule.findMany.mockResolvedValue([{ id: 'rule-1' }, { id: 'rule-2' }]);
    generator.generateRule
      .mockRejectedValueOnce(new Error('errore isolato'))
      .mockResolvedValueOnce({
        processedRules: 1,
        generatedExpenses: 2,
        completedRules: 1,
        skippedExisting: 0,
        skippedExceptions: 1,
        errors: 0,
      });
    const result = await service.runCycle(now);
    expect(result).toMatchObject({
      processedRules: 1,
      generatedExpenses: 2,
      completedRules: 1,
      skippedExceptions: 1,
      errors: 1,
    });
  });
});
