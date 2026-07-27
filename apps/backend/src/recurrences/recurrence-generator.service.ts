import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ExpenseStatus,
  Prisma,
  RecurrenceStatus,
  ReminderType,
} from '@prisma/client';

import { formatExpenseDate, formatExpenseTime } from '../expenses/expense.utils';
import {
  localDateOnly,
  localDateTimeToUtc,
  REMINDER_OFFSET_MINUTES,
} from '../notifications/notification-time.utils';
import { PrismaService } from '../prisma/prisma.service';
import { RecurrenceCalculatorService } from './recurrence-calculator.service';
import type { RecurrenceGenerationResult } from './recurrences.types';

const SAVE_TOLERANCE_MS = 60_000;

@Injectable()
export class RecurrenceGeneratorService {
  private readonly defaultReminderTime: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: RecurrenceCalculatorService,
    config: ConfigService,
  ) {
    this.defaultReminderTime = config.get<string>('DEFAULT_EXPENSE_REMINDER_TIME', '09:00');
  }

  async generateRule(
    ruleId: string,
    now = new Date(),
    maximumOccurrences = 500,
  ): Promise<RecurrenceGenerationResult> {
    const snapshot = await this.prisma.recurrenceRule.findFirst({
      where: {
        id: ruleId,
        status: RecurrenceStatus.ACTIVE,
        deletedAt: null,
        nextOccurrenceDate: { not: null },
      },
      include: { user: { select: { timezone: true } } },
    });
    if (!snapshot?.nextOccurrenceDate) return emptyGenerationResult();

    const today = localDateOnly(now, snapshot.user.timezone);
    const horizon = this.calculator.horizon(today, snapshot.generateDaysAhead);
    if (snapshot.nextOccurrenceDate > horizon) return emptyGenerationResult();

    return this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.recurrenceRule.updateMany({
        where: {
          id: snapshot.id,
          status: RecurrenceStatus.ACTIVE,
          deletedAt: null,
          nextOccurrenceDate: snapshot.nextOccurrenceDate,
          generationVersion: snapshot.generationVersion,
        },
        data: { generationVersion: { increment: 1 } },
      });
      if (claimed.count === 0) return emptyGenerationResult();

      const rule = await transaction.recurrenceRule.findUniqueOrThrow({
        where: { id: snapshot.id },
        include: {
          user: { select: { timezone: true } },
          labels: { select: { labelId: true } },
          reminderTemplates: true,
          exceptions: { select: { occurrenceDate: true } },
        },
      });
      if (!rule.nextOccurrenceDate) return emptyGenerationResult();

      const actual = await transaction.expense.aggregate({
        where: { recurrenceRuleId: rule.id },
        _count: { _all: true },
        _max: { occurrenceDate: true },
      });
      let generatedCount = Math.max(rule.generatedCount, actual._count._all);
      let latestGenerated = latestDate(rule.lastGeneratedDate, actual._max.occurrenceDate);
      let candidate = rule.nextOccurrenceDate;
      const exceptions = new Set(
        rule.exceptions.map((exception) => formatExpenseDate(exception.occurrenceDate)),
      );
      const schedule = {
        frequency: rule.frequency,
        interval: rule.interval,
        startDate: rule.startDate,
        endDate: rule.endDate,
        maxOccurrences: rule.maxOccurrences,
      };
      const result = emptyGenerationResult();
      result.processedRules = 1;
      let examined = 0;

      while (
        candidate <= horizon &&
        examined < maximumOccurrences &&
        this.calculator.withinLimits(candidate, schedule, generatedCount)
      ) {
        examined += 1;
        const occurrenceKey = formatExpenseDate(candidate);
        if (exceptions.has(occurrenceKey)) {
          result.skippedExceptions += 1;
          candidate = this.calculator.next(candidate, schedule);
          continue;
        }

        const inserted = await transaction.expense.createMany({
          data: [{
            userId: rule.userId,
            categoryId: rule.categoryId,
            description: rule.name,
            amount: rule.amount,
            expenseDate: candidate,
            expenseTime: rule.expenseTime,
            merchant: rule.merchant,
            paymentMethod: rule.paymentMethod,
            notes: rule.notes,
            status: ExpenseStatus.PLANNED,
            recurrenceRuleId: rule.id,
            occurrenceDate: candidate,
            generatedByRecurrence: true,
          }],
          skipDuplicates: true,
        });

        if (inserted.count === 1) {
          const expense = await transaction.expense.findUniqueOrThrow({
            where: {
              recurrenceRuleId_occurrenceDate: {
                recurrenceRuleId: rule.id,
                occurrenceDate: candidate,
              },
            },
            select: { id: true },
          });
          if (rule.labels.length > 0) {
            await transaction.expenseLabel.createMany({
              data: rule.labels.map(({ labelId }) => ({ expenseId: expense.id, labelId })),
              skipDuplicates: true,
            });
          }
          await this.createReminders(
            transaction,
            expense.id,
            rule.userId,
            candidate,
            rule.expenseTime,
            rule.user.timezone,
            rule.reminderTemplates,
            now,
          );
          generatedCount += 1;
          latestGenerated = latestDate(latestGenerated, candidate);
          result.generatedExpenses += 1;
        } else {
          result.skippedExisting += 1;
        }
        candidate = this.calculator.next(candidate, schedule);
      }

      const completed = !this.calculator.withinLimits(candidate, schedule, generatedCount);
      await transaction.recurrenceRule.update({
        where: { id: rule.id },
        data: {
          generatedCount,
          lastGeneratedDate: latestGenerated,
          nextOccurrenceDate: completed ? null : candidate,
          status: completed ? RecurrenceStatus.COMPLETED : RecurrenceStatus.ACTIVE,
          completedAt: completed ? now : null,
        },
      });
      if (completed) result.completedRules = 1;
      return result;
    }, { timeout: 20_000 });
  }

  private async createReminders(
    transaction: Prisma.TransactionClient,
    expenseId: string,
    userId: string,
    occurrenceDate: Date,
    expenseTime: Date | null,
    timezone: string,
    templates: Array<{
      type: ReminderType;
      offsetMinutes: number;
      reminderTime: Date | null;
    }>,
    now: Date,
  ): Promise<void> {
    if (templates.length === 0) return;
    const occurrence = formatExpenseDate(occurrenceDate);
    const expenseLocalTime = formatExpenseTime(expenseTime);
    const rows = templates.map((template) => {
      const time =
        formatExpenseTime(template.reminderTime) ??
        expenseLocalTime ??
        this.defaultReminderTime;
      const deadline = localDateTimeToUtc(occurrence, time, timezone);
      const scheduledAt = new Date(deadline.getTime() - template.offsetMinutes * 60_000);
      const active = scheduledAt.getTime() >= now.getTime() - SAVE_TOLERANCE_MS;
      return {
        userId,
        expenseId,
        type: template.type,
        offsetMinutes: template.offsetMinutes,
        scheduledAt,
        isActive: active,
        cancelledAt: active ? null : now,
      };
    });
    await transaction.expenseReminder.createMany({ data: rows, skipDuplicates: true });
  }
}

export function reminderOffset(type: ReminderType): number {
  if (type === ReminderType.CUSTOM) {
    throw new Error('I template ricorrenti non supportano promemoria CUSTOM');
  }
  return REMINDER_OFFSET_MINUTES[type];
}

function latestDate(left: Date | null, right: Date | null): Date | null {
  if (!left) return right;
  if (!right) return left;
  return left >= right ? left : right;
}

export function emptyGenerationResult(): RecurrenceGenerationResult {
  return {
    processedRules: 0,
    generatedExpenses: 0,
    completedRules: 0,
    skippedExisting: 0,
    skippedExceptions: 0,
    errors: 0,
  };
}
