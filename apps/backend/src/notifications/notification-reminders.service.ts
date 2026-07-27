import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ExpenseStatus,
  Prisma,
  ReminderType,
  type ExpenseReminder,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExpenseReminderDto,
  UpdateExpenseReminderDto,
} from './dto/notification.dto';
import {
  expenseDeadlineUtc,
  REMINDER_OFFSET_MINUTES,
  scheduledAtForPreset,
} from './notification-time.utils';
import { NotificationsMapper } from './notifications.mapper';
import type { ExpenseReminderResponse } from './notifications.types';

const SAVE_TOLERANCE_MS = 60_000;

@Injectable()
export class NotificationRemindersService {
  private readonly defaultTime: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.defaultTime = config.get<string>('DEFAULT_EXPENSE_REMINDER_TIME', '09:00');
  }

  async list(userId: string, expenseId: string): Promise<ExpenseReminderResponse[]> {
    await this.findOwnedExpense(userId, expenseId, false);
    const reminders = await this.prisma.expenseReminder.findMany({
      where: { userId, expenseId },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
    });
    return reminders.map((reminder) => NotificationsMapper.reminder(reminder));
  }

  async create(
    userId: string,
    expenseId: string,
    dto: CreateExpenseReminderDto,
  ): Promise<ExpenseReminderResponse> {
    const expense = await this.findOwnedExpense(userId, expenseId, true);
    const deadline = this.deadline(expense);
    const values = this.values(dto.type, dto.scheduledAt, deadline);
    this.assertNotPast(values.scheduledAt);

    const existing = await this.prisma.expenseReminder.findUnique({
      where: {
        expenseId_type_scheduledAt: {
          expenseId,
          type: dto.type,
          scheduledAt: values.scheduledAt,
        },
      },
    });
    if (existing?.isActive || existing?.processedAt) {
      throw new ConflictException('Esiste già un promemoria equivalente');
    }
    if (existing) {
      return NotificationsMapper.reminder(
        await this.prisma.expenseReminder.update({
          where: { id: existing.id },
          data: {
            offsetMinutes: values.offsetMinutes,
            isActive: true,
            cancelledAt: null,
          },
        }),
      );
    }

    try {
      return NotificationsMapper.reminder(
        await this.prisma.expenseReminder.create({
          data: {
            userId,
            expenseId,
            type: dto.type,
            ...values,
          },
        }),
      );
    } catch (error) {
      this.rethrowDuplicate(error);
      throw error;
    }
  }

  async update(
    userId: string,
    expenseId: string,
    reminderId: string,
    dto: UpdateExpenseReminderDto,
  ): Promise<ExpenseReminderResponse> {
    const expense = await this.findOwnedExpense(userId, expenseId, dto.isActive !== false);
    const reminder = await this.findOwnedReminder(userId, expenseId, reminderId);
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('Indicare almeno un campo da modificare');
    }
    if (reminder.processedAt && dto.isActive !== false) {
      throw new ConflictException('Un promemoria processato può soltanto essere disattivato');
    }

    const type = dto.type ?? reminder.type;
    const suppliedScheduledAt =
      dto.scheduledAt ?? (type === ReminderType.CUSTOM ? reminder.scheduledAt.toISOString() : undefined);
    const values = this.values(type, suppliedScheduledAt, this.deadline(expense));
    if (dto.isActive !== false) this.assertNotPast(values.scheduledAt);

    try {
      return NotificationsMapper.reminder(
        await this.prisma.expenseReminder.update({
          where: { id: reminder.id },
          data: {
            type,
            ...values,
            isActive: dto.isActive,
            cancelledAt: dto.isActive === false ? new Date() : dto.isActive ? null : undefined,
          },
        }),
      );
    } catch (error) {
      this.rethrowDuplicate(error);
      throw error;
    }
  }

  async remove(userId: string, expenseId: string, reminderId: string): Promise<void> {
    await this.findOwnedExpense(userId, expenseId, false);
    const reminder = await this.findOwnedReminder(userId, expenseId, reminderId);
    if (!reminder.isActive) return;
    await this.prisma.expenseReminder.update({
      where: { id: reminder.id },
      data: { isActive: false, cancelledAt: new Date() },
    });
  }

  async validateExpenseMutation(
    userId: string,
    expenseId: string,
    expenseDate: Date,
    expenseTime: Date | null,
    status: ExpenseStatus,
  ): Promise<void> {
    if (status !== ExpenseStatus.PLANNED) return;
    const expense = await this.findOwnedExpense(userId, expenseId, false);
    const deadline = expenseDeadlineUtc(
      expenseDate,
      expenseTime,
      preferenceTime(expense.user.preference?.defaultReminderTime, this.defaultTime),
      expense.user.timezone,
    );
    const invalidCustom = await this.prisma.expenseReminder.findFirst({
      where: {
        userId,
        expenseId,
        type: ReminderType.CUSTOM,
        isActive: true,
        processedAt: null,
        scheduledAt: { gt: deadline },
      },
      select: { id: true },
    });
    if (invalidCustom) {
      throw new BadRequestException(
        'La nuova scadenza precede un promemoria personalizzato: correggere prima il promemoria',
      );
    }
  }

  async handleExpenseMutation(
    transaction: Prisma.TransactionClient,
    expenseId: string,
    status: ExpenseStatus,
    dateOrTimeChanged: boolean,
  ): Promise<void> {
    if (status !== ExpenseStatus.PLANNED) {
      await transaction.expenseReminder.updateMany({
        where: { expenseId, isActive: true, processedAt: null },
        data: { isActive: false, cancelledAt: new Date() },
      });
      return;
    }
    if (!dateOrTimeChanged) return;

    const expense = await transaction.expense.findUniqueOrThrow({
      where: { id: expenseId },
      include: {
        user: {
          select: {
            timezone: true,
            preference: { select: { defaultReminderTime: true } },
          },
        },
      },
    });
    const deadline = expenseDeadlineUtc(
      expense.expenseDate,
      expense.expenseTime,
      preferenceTime(expense.user.preference?.defaultReminderTime, this.defaultTime),
      expense.user.timezone,
    );
    const presets = await transaction.expenseReminder.findMany({
      where: {
        expenseId,
        type: { not: ReminderType.CUSTOM },
        isActive: true,
        processedAt: null,
      },
    });
    const now = Date.now();
    for (const reminder of presets) {
      const scheduledAt = scheduledAtForPreset(
        reminder.type as Exclude<ReminderType, 'CUSTOM'>,
        deadline,
      );
      const remainsValid = scheduledAt.getTime() >= now - SAVE_TOLERANCE_MS;
      await transaction.expenseReminder.update({
        where: { id: reminder.id },
        data: {
          scheduledAt,
          offsetMinutes: REMINDER_OFFSET_MINUTES[
            reminder.type as Exclude<ReminderType, 'CUSTOM'>
          ],
          isActive: remainsValid,
          cancelledAt: remainsValid ? null : new Date(),
        },
      });
    }
  }

  private async findOwnedExpense(userId: string, expenseId: string, requirePlanned: boolean) {
    const expense = await this.prisma.expense.findFirst({
      where: { id: expenseId, userId, deletedAt: null },
      include: {
        user: {
          select: {
            timezone: true,
            preference: { select: { defaultReminderTime: true } },
          },
        },
      },
    });
    if (!expense) throw new NotFoundException('Spesa non trovata');
    if (requirePlanned && expense.status !== ExpenseStatus.PLANNED) {
      throw new BadRequestException('I promemoria sono disponibili soltanto per spese pianificate');
    }
    return expense;
  }

  private async findOwnedReminder(
    userId: string,
    expenseId: string,
    reminderId: string,
  ): Promise<ExpenseReminder> {
    const reminder = await this.prisma.expenseReminder.findFirst({
      where: { id: reminderId, userId, expenseId },
    });
    if (!reminder) throw new NotFoundException('Promemoria non trovato');
    return reminder;
  }

  private deadline(expense: Awaited<ReturnType<NotificationRemindersService['findOwnedExpense']>>): Date {
    return expenseDeadlineUtc(
      expense.expenseDate,
      expense.expenseTime,
      preferenceTime(expense.user.preference?.defaultReminderTime, this.defaultTime),
      expense.user.timezone,
    );
  }

  private values(type: ReminderType, scheduledAt: string | undefined, deadline: Date) {
    if (type === ReminderType.CUSTOM) {
      if (!scheduledAt) throw new BadRequestException('La data è obbligatoria per un promemoria personalizzato');
      if (!/(?:Z|[+-]\d{2}:\d{2})$/i.test(scheduledAt)) {
        throw new BadRequestException('La data personalizzata deve includere il fuso orario');
      }
      const custom = new Date(scheduledAt);
      if (custom > deadline) {
        throw new BadRequestException('Il promemoria deve precedere la scadenza della spesa');
      }
      return { scheduledAt: custom, offsetMinutes: null };
    }
    if (scheduledAt !== undefined) {
      throw new BadRequestException('Non indicare scheduledAt per un promemoria predefinito');
    }
    return {
      scheduledAt: scheduledAtForPreset(type, deadline),
      offsetMinutes: REMINDER_OFFSET_MINUTES[type],
    };
  }

  private assertNotPast(scheduledAt: Date): void {
    if (scheduledAt.getTime() < Date.now() - SAVE_TOLERANCE_MS) {
      throw new BadRequestException('Il promemoria non può essere nel passato');
    }
  }

  private rethrowDuplicate(error: unknown): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('Esiste già un promemoria equivalente');
    }
  }
}

function preferenceTime(value: Date | null | undefined, fallback: string): string {
  if (!value) return fallback;
  return `${String(value.getUTCHours()).padStart(2, '0')}:${String(value.getUTCMinutes()).padStart(2, '0')}`;
}
