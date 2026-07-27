import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { RecurrenceStatus } from '@prisma/client';

import { localDateOnly } from '../notifications/notification-time.utils';
import { PrismaService } from '../prisma/prisma.service';
import {
  emptyGenerationResult,
  RecurrenceGeneratorService,
} from './recurrence-generator.service';
import type { RecurrenceGenerationResult } from './recurrences.types';

const RECURRENCE_CRON = process.env['RECURRENCE_SCHEDULER_CRON'] ?? '0 * * * *';
const RULE_BATCH_SIZE = 100;

@Injectable()
export class RecurrenceSchedulerService {
  private readonly logger = new Logger(RecurrenceSchedulerService.name);
  private readonly maximumDaysAhead: number;
  private readonly maximumPerRun: number;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly generator: RecurrenceGeneratorService,
    config: ConfigService,
  ) {
    this.maximumDaysAhead = config.get<number>(
      'MAX_RECURRENCE_GENERATION_DAYS_AHEAD',
      365,
    );
    this.maximumPerRun = config.get<number>('MAX_RECURRENCE_OCCURRENCES_PER_RUN', 500);
  }

  @Cron(RECURRENCE_CRON, { name: 'expense-recurrences', waitForCompletion: true })
  async scheduledRun(): Promise<void> {
    await this.runCycle();
  }

  async runCycle(now = new Date()): Promise<RecurrenceGenerationResult> {
    if (this.running) {
      this.logger.warn('Recurrence scheduler skipped an overlapping run.');
      return emptyGenerationResult();
    }
    this.running = true;
    const result = emptyGenerationResult();
    try {
      const today = localDateOnly(now, 'Europe/Rome');
      const maximumHorizon = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() + this.maximumDaysAhead,
        ),
      );
      const rules = await this.prisma.recurrenceRule.findMany({
        where: {
          status: RecurrenceStatus.ACTIVE,
          deletedAt: null,
          nextOccurrenceDate: { not: null, lte: maximumHorizon },
        },
        select: { id: true },
        orderBy: [{ nextOccurrenceDate: 'asc' }, { id: 'asc' }],
        take: RULE_BATCH_SIZE,
      });

      for (const rule of rules) {
        const remaining = this.maximumPerRun - result.generatedExpenses;
        if (remaining <= 0) break;
        try {
          const generated = await this.generator.generateRule(rule.id, now, remaining);
          addResult(result, generated);
        } catch (error) {
          result.errors += 1;
          this.logger.error(`Recurrence rule ${rule.id} failed: ${safeError(error)}`);
        }
      }
      this.logger.log(
        `Recurrence scheduler processed ${result.processedRules} active rules; ` +
          `generated ${result.generatedExpenses} expenses; completed ${result.completedRules}; ` +
          `skipped ${result.skippedExisting} existing occurrences; errors ${result.errors}.`,
      );
      return result;
    } finally {
      this.running = false;
    }
  }
}

function addResult(
  target: RecurrenceGenerationResult,
  source: RecurrenceGenerationResult,
): void {
  target.processedRules += source.processedRules;
  target.generatedExpenses += source.generatedExpenses;
  target.completedRules += source.completedRules;
  target.skippedExisting += source.skippedExisting;
  target.skippedExceptions += source.skippedExceptions;
  target.errors += source.errors;
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : 'errore sconosciuto';
}
