import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import {
  ExpenseStatus,
  NotificationStatus,
  NotificationType,
  Prisma,
  ReminderType,
} from '@prisma/client';

import { formatExpenseDate } from '../expenses/expense.utils';
import { PrismaService } from '../prisma/prisma.service';
import {
  expenseDeadlineUtc,
  localDateOnly,
} from './notification-time.utils';
import type { SchedulerCycleResult } from './notifications.types';

const SCHEDULER_CRON = process.env['NOTIFICATION_SCHEDULER_CRON'] ?? '*/1 * * * *';
const BATCH_SIZE = 100;

@Injectable()
export class NotificationSchedulerService {
  private readonly logger = new Logger(NotificationSchedulerService.name);
  private readonly defaultTime: string;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.defaultTime = config.get<string>('DEFAULT_EXPENSE_REMINDER_TIME', '09:00');
  }

  @Cron(SCHEDULER_CRON, { name: 'expense-notifications', waitForCompletion: true })
  async scheduledRun(): Promise<void> {
    await this.runCycle();
  }

  async runCycle(now = new Date()): Promise<SchedulerCycleResult> {
    if (this.running) {
      this.logger.warn('Notification scheduler skipped an overlapping run.');
      return emptyResult();
    }
    this.running = true;
    const result = emptyResult();
    try {
      await this.processReminders(now, result);
      await this.processDueToday(now, result);
      await this.processOverdue(now, result);
      this.logger.log(
        `Notification scheduler processed ${result.processedReminders} reminders; ` +
          `generated ${result.generatedNotifications} notifications; errors ${result.errors}.`,
      );
      return result;
    } finally {
      this.running = false;
    }
  }

  private async processReminders(now: Date, result: SchedulerCycleResult): Promise<void> {
    const reminders = await this.prisma.expenseReminder.findMany({
      where: {
        isActive: true,
        processedAt: null,
        scheduledAt: { lte: now },
        expense: { status: ExpenseStatus.PLANNED, deletedAt: null },
      },
      include: { expense: true },
      orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
      take: BATCH_SIZE,
    });
    for (const reminder of reminders) {
      try {
        const generated = await this.prisma.$transaction(async (transaction) => {
          const expense = await transaction.expense.findFirst({
            where: {
              id: reminder.expenseId,
              userId: reminder.userId,
              status: ExpenseStatus.PLANNED,
              deletedAt: null,
            },
          });
          if (!expense) {
            await transaction.expenseReminder.updateMany({
              where: { id: reminder.id, processedAt: null },
              data: { isActive: false, cancelledAt: now },
            });
            return false;
          }
          const claimed = await transaction.expenseReminder.updateMany({
            where: { id: reminder.id, isActive: true, processedAt: null },
            data: { processedAt: now },
          });
          if (claimed.count === 0) return false;

          const type =
            reminder.type === ReminderType.SAME_DAY
              ? NotificationType.EXPENSE_DUE_TODAY
              : NotificationType.EXPENSE_REMINDER;
          const deduplicationKey =
            type === NotificationType.EXPENSE_DUE_TODAY
              ? dueTodayKey(expense.id, expense.expenseDate)
              : `expense-reminder:${reminder.id}:${reminder.scheduledAt.toISOString()}`;
          const notification = notificationContent(
            type,
            expense.description,
            reminder.type,
          );
          const upserted = await transaction.notification.upsert({
            where: { deduplicationKey },
            create: {
              userId: reminder.userId,
              expenseId: expense.id,
              reminderId: reminder.id,
              type,
              status: NotificationStatus.UNREAD,
              scheduledAt: reminder.scheduledAt,
              deduplicationKey,
              ...notification,
            },
            update: {},
            select: { createdAt: true },
          });
          return upserted.createdAt.getTime() >= now.getTime() - 1_000;
        });
        result.processedReminders += 1;
        if (generated) {
          result.generatedNotifications += 1;
        }
      } catch (error) {
        result.errors += 1;
        this.logger.error(`Notification reminder ${reminder.id} failed: ${safeError(error)}`);
      }
    }
  }

  private async processDueToday(now: Date, result: SchedulerCycleResult): Promise<void> {
    const defaultTimezone = 'Europe/Rome';
    const today = localDateOnly(now, defaultTimezone);
    const expenses = await this.prisma.expense.findMany({
      where: {
        status: ExpenseStatus.PLANNED,
        deletedAt: null,
        expenseDate: today,
        user: {
          OR: [
            { preference: { is: null } },
            { preference: { is: { dueTodayEnabled: true } } },
          ],
        },
      },
      include: {
        user: {
          select: {
            timezone: true,
            preference: {
              select: { dueTodayEnabled: true, defaultReminderTime: true },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
    });
    for (const expense of expenses) {
      try {
        if (expense.user.preference?.dueTodayEnabled === false) continue;
        const deadline = expenseDeadlineUtc(
          expense.expenseDate,
          expense.expenseTime,
          preferenceTime(expense.user.preference?.defaultReminderTime, this.defaultTime),
          expense.user.timezone,
        );
        if (deadline > now) continue;
        const generated = await this.createAutomaticNotification(
          expense.id,
          expense.userId,
          expense.description,
          expense.expenseDate,
          deadline,
          NotificationType.EXPENSE_DUE_TODAY,
        );
        if (generated) {
          result.generatedDueToday += 1;
          result.generatedNotifications += 1;
        }
      } catch (error) {
        result.errors += 1;
        this.logger.error(`Notification due-today expense ${expense.id} failed: ${safeError(error)}`);
      }
    }
  }

  private async processOverdue(now: Date, result: SchedulerCycleResult): Promise<void> {
    const today = localDateOnly(now, 'Europe/Rome');
    const expenses = await this.prisma.expense.findMany({
      where: {
        status: ExpenseStatus.PLANNED,
        deletedAt: null,
        expenseDate: { lt: today },
        overdueNotifiedForDate: null,
        user: {
          OR: [
            { preference: { is: null } },
            { preference: { is: { overdueEnabled: true } } },
          ],
        },
      },
      include: {
        user: {
          select: {
            timezone: true,
            preference: {
              select: { overdueEnabled: true, defaultReminderTime: true },
            },
          },
        },
      },
      orderBy: [{ expenseDate: 'asc' }, { id: 'asc' }],
      take: BATCH_SIZE,
    });
    for (const expense of expenses) {
      try {
        if (expense.user.preference?.overdueEnabled === false) continue;
        const scheduledAt = expenseDeadlineUtc(
          expense.expenseDate,
          expense.expenseTime,
          preferenceTime(expense.user.preference?.defaultReminderTime, this.defaultTime),
          expense.user.timezone,
        );
        const generated = await this.prisma.$transaction(async (transaction) => {
          const claimed = await transaction.expense.updateMany({
            where: {
              id: expense.id,
              status: ExpenseStatus.PLANNED,
              deletedAt: null,
              expenseDate: expense.expenseDate,
              overdueNotifiedForDate: null,
            },
            data: { overdueNotifiedForDate: expense.expenseDate },
          });
          if (claimed.count === 0) return false;
          await transaction.notification.upsert({
            where: { deduplicationKey: overdueKey(expense.id, expense.expenseDate) },
            create: {
              userId: expense.userId,
              expenseId: expense.id,
              type: NotificationType.EXPENSE_OVERDUE,
              status: NotificationStatus.UNREAD,
              title: 'Spesa scaduta',
              message: `La spesa “${expense.description}” risulta scaduta.`,
              scheduledAt,
              deduplicationKey: overdueKey(expense.id, expense.expenseDate),
            },
            update: {},
          });
          return true;
        });
        if (generated) {
          result.generatedOverdue += 1;
          result.generatedNotifications += 1;
        }
      } catch (error) {
        result.errors += 1;
        this.logger.error(`Notification overdue expense ${expense.id} failed: ${safeError(error)}`);
      }
    }
  }

  private async createAutomaticNotification(
    expenseId: string,
    userId: string,
    description: string,
    expenseDate: Date,
    scheduledAt: Date,
    type: NotificationType,
  ): Promise<boolean> {
    const deduplicationKey = dueTodayKey(expenseId, expenseDate);
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          expenseId,
          type,
          status: NotificationStatus.UNREAD,
          title: 'Spesa prevista oggi',
          message: `La spesa “${description}” è prevista per oggi.`,
          scheduledAt,
          deduplicationKey,
        },
      });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return false;
      }
      throw error;
    }
  }
}

function dueTodayKey(expenseId: string, expenseDate: Date): string {
  return `expense-due-today:${expenseId}:${formatExpenseDate(expenseDate)}`;
}

function overdueKey(expenseId: string, expenseDate: Date): string {
  return `expense-overdue:${expenseId}:${formatExpenseDate(expenseDate)}`;
}

function notificationContent(
  type: NotificationType,
  description: string,
  reminderType: ReminderType,
): { title: string; message: string } {
  if (type === NotificationType.EXPENSE_DUE_TODAY) {
    return {
      title: 'Spesa prevista oggi',
      message: `La spesa “${description}” è prevista per oggi.`,
    };
  }
  const days =
    reminderType === ReminderType.ONE_DAY_BEFORE
      ? 1
      : reminderType === ReminderType.THREE_DAYS_BEFORE
        ? 3
        : reminderType === ReminderType.SEVEN_DAYS_BEFORE
          ? 7
          : null;
  return {
    title: 'Spesa in scadenza',
    message:
      days === null
        ? `La spesa “${description}” è in scadenza.`
        : `La spesa “${description}” è prevista tra ${days} ${days === 1 ? 'giorno' : 'giorni'}.`,
  };
}

function emptyResult(): SchedulerCycleResult {
  return {
    processedReminders: 0,
    generatedNotifications: 0,
    generatedDueToday: 0,
    generatedOverdue: 0,
    errors: 0,
  };
}

function safeError(error: unknown): string {
  return error instanceof Error ? error.message : 'errore sconosciuto';
}

function preferenceTime(value: Date | null | undefined, fallback: string): string {
  if (!value) return fallback;
  return `${String(value.getUTCHours()).padStart(2, '0')}:${String(value.getUTCMinutes()).padStart(2, '0')}`;
}
