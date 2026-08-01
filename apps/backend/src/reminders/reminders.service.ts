import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ExpenseStatus, Prisma } from '@prisma/client';

import type { ApiPayload } from '../common/interceptors/api-response.interceptor';
import { parseExpenseDate } from '../expenses/expense.utils';
import { NotificationRemindersService } from '../notifications/notification-reminders.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  ReminderQueryDto,
  ReminderSortField,
  UpdateGlobalReminderDto,
} from './dto/reminder.dto';
import { RemindersMapper } from './reminders.mapper';
import {
  reminderInclude,
  type ReminderBulkResult,
  type ReminderResponse,
  type ReminderSummary,
  type ReminderWithRelations,
} from './reminders.types';
import { addDays, bulkReason, statusWhere, validExpenseWhere } from './reminders.utils';

@Injectable()
export class RemindersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly contextual: NotificationRemindersService,
  ) {}

  async findAll(
    userId: string,
    query: ReminderQueryDto,
    now = new Date(),
  ): Promise<ApiPayload<ReminderResponse[]>> {
    this.validateRanges(query);
    const where = this.buildWhere(userId, query, now);
    const [totalItems, reminders] = await this.prisma.$transaction([
      this.prisma.expenseReminder.count({ where }),
      this.prisma.expenseReminder.findMany({
        where,
        include: reminderInclude,
        orderBy: this.orderBy(query),
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      data: reminders.map((reminder) => RemindersMapper.toResponse(reminder, now)),
      meta: pagination(query.page, query.pageSize, totalItems),
    };
  }

  async summary(
    userId: string,
    upcomingDays = 7,
    now = new Date(),
  ): Promise<ReminderSummary> {
    const activeBase: Prisma.ExpenseReminderWhereInput = {
      userId,
      isActive: true,
      processedAt: null,
      expense: { is: validExpenseWhere() },
    };
    const [activeCount, upcomingCount, dueCount, processedCount, cancelledCount, next] =
      await Promise.all([
        this.prisma.expenseReminder.count({ where: activeBase }),
        this.prisma.expenseReminder.count({
          where: { ...activeBase, scheduledAt: { gt: now, lte: addDays(now, upcomingDays) } },
        }),
        this.prisma.expenseReminder.count({ where: { ...activeBase, scheduledAt: { lte: now } } }),
        this.prisma.expenseReminder.count({ where: { userId, processedAt: { not: null } } }),
        this.prisma.expenseReminder.count({
          where: {
            userId,
            processedAt: null,
            OR: [{ isActive: false }, { cancelledAt: { not: null } }],
          },
        }),
        this.prisma.expenseReminder.findFirst({
          where: { ...activeBase, scheduledAt: { gt: now } },
          orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            scheduledAt: true,
            expense: { select: { id: true, description: true } },
          },
        }),
      ]);
    return {
      activeCount,
      upcomingCount,
      dueCount,
      processedCount,
      cancelledCount,
      nextReminder: next
        ? {
            id: next.id,
            scheduledAt: next.scheduledAt.toISOString(),
            expenseId: next.expense.id,
            expenseDescription: next.expense.description,
          }
        : null,
    };
  }

  async findOne(userId: string, id: string, now = new Date()): Promise<ReminderResponse> {
    return RemindersMapper.toResponse(await this.findOwned(userId, id), now);
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateGlobalReminderDto,
    now = new Date(),
  ): Promise<ReminderResponse> {
    if (dto.type === undefined && dto.scheduledAt === undefined) {
      throw new BadRequestException('Indicare almeno un campo da modificare');
    }
    const reminder = await this.findOwned(userId, id);
    if (reminder.processedAt) {
      throw new ConflictException('Il promemoria è già stato elaborato e non può essere modificato');
    }
    if (reminder.expense.deletedAt || reminder.expense.status !== ExpenseStatus.PLANNED) {
      throw new ConflictException('La spesa collegata non è pianificata o non è più disponibile');
    }
    await this.contextual.update(userId, reminder.expenseId, id, {
      type: dto.type,
      scheduledAt: dto.scheduledAt,
    });
    return this.findOne(userId, id, now);
  }

  async cancel(userId: string, id: string, now = new Date()): Promise<ReminderResponse> {
    const reminder = await this.findOwned(userId, id);
    if (!reminder.isActive || reminder.cancelledAt) {
      return RemindersMapper.toResponse(reminder, now);
    }
    if (reminder.processedAt) throw new ConflictException('Il promemoria è già stato elaborato');
    await this.prisma.expenseReminder.update({
      where: { id },
      data: { isActive: false, cancelledAt: now },
    });
    return this.findOne(userId, id, now);
  }

  async reactivate(userId: string, id: string, now = new Date()): Promise<ReminderResponse> {
    const reminder = await this.findOwned(userId, id);
    if (reminder.isActive && !reminder.cancelledAt) {
      return RemindersMapper.toResponse(reminder, now);
    }
    if (reminder.processedAt) throw new ConflictException('Il promemoria è già stato elaborato');
    if (reminder.expense.deletedAt || reminder.expense.status !== ExpenseStatus.PLANNED) {
      throw new ConflictException('La spesa collegata deve essere pianificata e disponibile');
    }
    if (reminder.scheduledAt <= now) {
      throw new ConflictException(
        'Il promemoria non può essere riattivato perché la data prevista è già trascorsa. Modifica prima la data.',
      );
    }
    const duplicate = await this.prisma.expenseReminder.findFirst({
      where: {
        id: { not: id },
        userId,
        expenseId: reminder.expenseId,
        type: reminder.type,
        scheduledAt: reminder.scheduledAt,
        isActive: true,
      },
      select: { id: true },
    });
    if (duplicate) throw new ConflictException('Esiste già un promemoria equivalente');
    await this.prisma.expenseReminder.update({
      where: { id },
      data: { isActive: true, cancelledAt: null },
    });
    return this.findOne(userId, id, now);
  }

  async remove(userId: string, id: string): Promise<{ deleted: true }> {
    const reminder = await this.findOwned(userId, id);
    this.assertDeletable(reminder);
    await this.prisma.expenseReminder.delete({ where: { id } });
    return { deleted: true };
  }

  async bulk(
    userId: string,
    ids: string[],
    action: 'cancel' | 'reactivate' | 'delete',
    now = new Date(),
  ): Promise<ReminderBulkResult> {
    const result: ReminderBulkResult = {
      requestedCount: ids.length,
      updatedCount: 0,
      skippedCount: 0,
      errors: [],
    };
    for (const id of ids) {
      try {
        const current = await this.findOwned(userId, id);
        if (action === 'cancel' && (!current.isActive || current.cancelledAt)) {
          result.skippedCount += 1;
          continue;
        }
        if (action === 'reactivate' && current.isActive && !current.cancelledAt) {
          result.skippedCount += 1;
          continue;
        }
        if (action === 'cancel') await this.cancel(userId, id, now);
        else if (action === 'reactivate') await this.reactivate(userId, id, now);
        else await this.remove(userId, id);
        result.updatedCount += 1;
      } catch (error) {
        result.skippedCount += 1;
        result.errors.push({ id, reason: bulkReason(error) });
      }
    }
    return result;
  }

  private buildWhere(
    userId: string,
    query: ReminderQueryDto,
    now: Date,
  ): Prisma.ExpenseReminderWhereInput {
    const scheduledAt: Prisma.DateTimeFilter = {};
    if (query.scheduledFrom) scheduledAt.gte = new Date(query.scheduledFrom);
    if (query.scheduledTo) scheduledAt.lte = new Date(query.scheduledTo);
    const expenseDate: Prisma.DateTimeFilter = {};
    if (query.expenseDateFrom) expenseDate.gte = parseExpenseDate(query.expenseDateFrom, 'expenseDateFrom');
    if (query.expenseDateTo) expenseDate.lte = parseExpenseDate(query.expenseDateTo, 'expenseDateTo');
    const expenseFilters: Prisma.ExpenseWhereInput = {
      status: query.expenseStatus,
      categoryId: query.categoryId,
      recurrenceRuleId: query.recurrenceRuleId,
      expenseDate: Object.keys(expenseDate).length ? expenseDate : undefined,
    };
    const search: Prisma.ExpenseReminderWhereInput | undefined = query.search
      ? {
          OR: [
            { expense: { is: { description: { contains: query.search } } } },
            { expense: { is: { merchant: { contains: query.search } } } },
            { expense: { is: { category: { is: { name: { contains: query.search } } } } } },
            { expense: { is: { recurrenceRule: { is: { name: { contains: query.search } } } } } },
          ],
        }
      : undefined;
    return {
      userId,
      type: query.type,
      source: query.source,
      scheduledAt: Object.keys(scheduledAt).length ? scheduledAt : undefined,
      expense: Object.values(expenseFilters).some((value) => value !== undefined)
        ? { is: expenseFilters }
        : undefined,
      AND: [statusWhere(query.status, now), search].filter(
        (value): value is Prisma.ExpenseReminderWhereInput => value !== undefined,
      ),
    };
  }

  private orderBy(query: ReminderQueryDto): Prisma.ExpenseReminderOrderByWithRelationInput[] {
    const direction = query.sortDirection;
    let primary: Prisma.ExpenseReminderOrderByWithRelationInput;
    switch (query.sortBy) {
      case ReminderSortField.CREATED_AT:
        primary = { createdAt: direction };
        break;
      case ReminderSortField.UPDATED_AT:
        primary = { updatedAt: direction };
        break;
      case ReminderSortField.EXPENSE_DATE:
        primary = { expense: { expenseDate: direction } };
        break;
      case ReminderSortField.EXPENSE_DESCRIPTION:
        primary = { expense: { description: direction } };
        break;
      case ReminderSortField.STATUS:
        primary = { isActive: direction };
        break;
      default:
        primary = { scheduledAt: direction };
    }
    return [primary, { scheduledAt: direction }, { id: direction }];
  }

  private async findOwned(userId: string, id: string): Promise<ReminderWithRelations> {
    const reminder = await this.prisma.expenseReminder.findFirst({
      where: { id, userId },
      include: reminderInclude,
    });
    if (!reminder) throw new NotFoundException('Promemoria non trovato');
    return reminder;
  }

  private assertDeletable(reminder: ReminderWithRelations): void {
    if (reminder.processedAt) {
      throw new ConflictException('Un promemoria processato va conservato nello storico');
    }
    if (reminder.notifications.length > 0) {
      throw new ConflictException('Il promemoria ha generato una notifica: annullalo invece di eliminarlo');
    }
  }

  private validateRanges(query: ReminderQueryDto): void {
    if (query.scheduledFrom && query.scheduledTo && new Date(query.scheduledFrom) > new Date(query.scheduledTo)) {
      throw new BadRequestException('La data promemoria iniziale non può superare quella finale');
    }
    if (query.expenseDateFrom && query.expenseDateTo && query.expenseDateFrom > query.expenseDateTo) {
      throw new BadRequestException('La data spesa iniziale non può superare quella finale');
    }
  }
}

function pagination(page: number, pageSize: number, totalItems: number) {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize),
  };
}
