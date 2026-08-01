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
  RecurrenceStatus,
  ReminderType,
} from '@prisma/client';

import type { ApiPayload } from '../common/interceptors/api-response.interceptor';
import { ExpenseMapper } from '../expenses/expense.mapper';
import {
  formatExpenseDate,
  optionalPlainText,
  parseExpenseDate,
  parseExpenseTime,
  parseMoney,
} from '../expenses/expense.utils';
import { localDateOnly, localDateTimeToUtc } from '../notifications/notification-time.utils';
import { PrismaService } from '../prisma/prisma.service';
import {
  CancelRecurrenceDto,
  CreateRecurrenceDto,
  CreateRecurrenceExceptionDto,
  PauseRecurrenceDto,
  RecurrenceExpensesQueryDto,
  RecurrencePreviewDto,
  RecurrenceQueryDto,
  RecurrenceReminderTemplateDto,
  RecurrenceUpdateScope,
  UpdateRecurrenceDto,
} from './dto/recurrence.dto';
import { RecurrenceCalculatorService } from './recurrence-calculator.service';
import {
  RecurrenceGeneratorService,
  reminderOffset,
} from './recurrence-generator.service';
import { RecurrencesMapper } from './recurrences.mapper';
import type {
  RecurrencePaginationMeta,
  RecurrenceResponse,
  RecurrenceSummary,
  RecurrenceWithRelations,
} from './recurrences.types';

export const recurrenceInclude = {
  category: true,
  labels: { include: { label: true } },
  reminderTemplates: true,
  exceptions: { orderBy: { occurrenceDate: 'asc' as const } },
  _count: { select: { expenses: true } },
} satisfies Prisma.RecurrenceRuleInclude;

const generatedExpenseInclude = {
  category: true,
  labels: { include: { label: true } },
  recurrenceRule: { select: { id: true, name: true, status: true } },
} satisfies Prisma.ExpenseInclude;

@Injectable()
export class RecurrencesService {
  private readonly defaultGenerationDays: number;
  private readonly maximumGenerationDays: number;
  private readonly maximumPerRun: number;
  private readonly defaultReminderTime: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly calculator: RecurrenceCalculatorService,
    private readonly generator: RecurrenceGeneratorService,
    config: ConfigService,
  ) {
    this.defaultGenerationDays = config.get<number>(
      'DEFAULT_RECURRENCE_GENERATION_DAYS_AHEAD',
      30,
    );
    this.maximumGenerationDays = config.get<number>(
      'MAX_RECURRENCE_GENERATION_DAYS_AHEAD',
      365,
    );
    this.maximumPerRun = config.get<number>('MAX_RECURRENCE_OCCURRENCES_PER_RUN', 500);
    this.defaultReminderTime = config.get<string>('DEFAULT_EXPENSE_REMINDER_TIME', '09:00');
  }

  async findAll(
    userId: string,
    query: RecurrenceQueryDto,
  ): Promise<ApiPayload<RecurrenceResponse[]>> {
    const where = this.buildWhere(userId, query);
    const primaryOrder: Prisma.RecurrenceRuleOrderByWithRelationInput =
      query.sortBy === 'nextOccurrenceDate'
        ? { nextOccurrenceDate: { sort: query.sortDirection, nulls: 'last' } }
        : { [query.sortBy]: query.sortDirection };
    const orderBy = [
      primaryOrder,
      { createdAt: 'desc' as const },
      { id: 'desc' as const },
    ] as Prisma.RecurrenceRuleOrderByWithRelationInput[];
    const [totalItems, rules] = await this.prisma.$transaction([
      this.prisma.recurrenceRule.count({ where }),
      this.prisma.recurrenceRule.findMany({
        where,
        include: recurrenceInclude,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      data: rules.map((rule) => RecurrencesMapper.toResponse(rule)),
      meta: pagination(query.page, query.pageSize, totalItems),
    };
  }

  async summary(
    userId: string,
    query: RecurrenceQueryDto,
    now = new Date(),
  ): Promise<RecurrenceSummary> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    });
    if (!user) throw new NotFoundException('Utente non trovato');
    const today = localDateOnly(now, user.timezone);
    const horizon = this.calculator.horizon(today, 30);
    const ruleWhere = this.buildWhere(userId, query);
    const [statuses, upcoming] = await Promise.all([
      this.prisma.recurrenceRule.groupBy({
        by: ['status'],
        where: ruleWhere,
        _count: { _all: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          userId,
          recurrenceRuleId: { not: null },
          generatedByRecurrence: true,
          deletedAt: null,
          status: ExpenseStatus.PLANNED,
          expenseDate: { gte: today, lte: horizon },
          recurrenceRule: ruleWhere,
        },
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);
    const count = (status: RecurrenceStatus): number =>
      statuses.find((group) => group.status === status)?._count._all ?? 0;
    return {
      activeCount: count(RecurrenceStatus.ACTIVE),
      pausedCount: count(RecurrenceStatus.PAUSED),
      upcomingOccurrences: upcoming._count._all,
      upcomingTotal: (upcoming._sum.amount ?? new Prisma.Decimal(0)).toFixed(2),
      horizonDays: 30,
    };
  }

  async create(
    userId: string,
    dto: CreateRecurrenceDto,
    now = new Date(),
  ): Promise<RecurrenceResponse> {
    const input = await this.validatedInput(userId, dto);
    const rule = await this.prisma.$transaction((transaction) =>
      transaction.recurrenceRule.create({
        data: {
          userId,
          categoryId: dto.categoryId,
          name: normalize(dto.name),
          description: normalize(dto.name),
          amount: parseMoney(dto.amount),
          merchant: optionalPlainText(dto.merchant),
          paymentMethod: dto.paymentMethod,
          notes: optionalPlainText(dto.notes),
          frequency: dto.frequency,
          interval: dto.interval,
          startDate: input.startDate,
          endDate: input.endDate,
          nextOccurrenceDate: input.startDate,
          maxOccurrences: dto.maxOccurrences ?? null,
          expenseTime: parseExpenseTime(dto.expenseTime) ?? null,
          generateDaysAhead: dto.generateDaysAhead ?? this.defaultGenerationDays,
          labels: { create: input.labelIds.map((labelId) => ({ labelId })) },
          reminderTemplates: {
            create: input.templates.map((template) => ({
              type: template.type,
              offsetMinutes: reminderOffset(template.type),
              reminderTime: parseExpenseTime(template.reminderTime) ?? null,
            })),
          },
        },
        include: recurrenceInclude,
      }),
    );
    await this.generator.generateRule(rule.id, now, this.maximumPerRun);
    return this.findOne(userId, rule.id);
  }

  async findOne(userId: string, id: string): Promise<RecurrenceResponse> {
    const rule = await this.findOwned(userId, id);
    return RecurrencesMapper.toResponse(rule, this.previewForRule(rule, 5));
  }

  preview(dto: RecurrencePreviewDto): { dates: string[] } {
    const startDate = parseExpenseDate(dto.startDate, 'startDate');
    const endDate = dto.endDate ? parseExpenseDate(dto.endDate, 'endDate') : null;
    this.validateDateRange(startDate, endDate);
    const dates = this.calculator.preview(
      startDate,
      {
        frequency: dto.frequency,
        interval: dto.interval,
        startDate,
        endDate,
        maxOccurrences: dto.maxOccurrences ?? null,
      },
      dto.limit,
    );
    return { dates: dates.map((date) => formatExpenseDate(date)) };
  }

  async previewSaved(userId: string, id: string, limit: number): Promise<{ dates: string[] }> {
    const rule = await this.findOwned(userId, id);
    return { dates: this.previewForRule(rule, limit).map((date) => formatExpenseDate(date)) };
  }

  async expenses(
    userId: string,
    id: string,
    query: RecurrenceExpensesQueryDto,
  ): Promise<ApiPayload<ReturnType<typeof ExpenseMapper.toResponse>[]>> {
    await this.findOwned(userId, id);
    const date: Prisma.DateTimeFilter = {};
    if (query.dateFrom) date.gte = parseExpenseDate(query.dateFrom, 'dateFrom');
    if (query.dateTo) date.lte = parseExpenseDate(query.dateTo, 'dateTo');
    if (date.gte && date.lte && date.gte > date.lte) {
      throw new BadRequestException('La data iniziale non può superare la data finale');
    }
    const where: Prisma.ExpenseWhereInput = {
      userId,
      recurrenceRuleId: id,
      deletedAt: null,
      status: query.status,
      expenseDate: Object.keys(date).length ? date : undefined,
    };
    const [totalItems, expenses] = await this.prisma.$transaction([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        include: generatedExpenseInclude,
        orderBy: [{ expenseDate: query.sortDirection }, { createdAt: query.sortDirection }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    return {
      data: expenses.map((expense) => ExpenseMapper.toResponse(expense)),
      meta: pagination(query.page, query.pageSize, totalItems),
    };
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateRecurrenceDto,
    now = new Date(),
  ): Promise<RecurrenceResponse> {
    const current = await this.findOwned(userId, id);
    if (current.status === RecurrenceStatus.CANCELLED) {
      throw new BadRequestException('Una ricorrenza terminata non può essere modificata');
    }
    if (dto.startDate !== undefined && current.generatedCount > 0) {
      throw new ConflictException(
        'La data iniziale non può essere modificata dopo la prima generazione',
      );
    }
    const merged = await this.validatedMergedInput(userId, current, dto);
    const scheduleChanged = [
      dto.frequency,
      dto.interval,
      dto.startDate,
      dto.endDate,
      dto.maxOccurrences,
    ].some((value) => value !== undefined);
    let nextOccurrenceDate = current.nextOccurrenceDate;
    if (scheduleChanged) {
      nextOccurrenceDate =
        current.generatedCount === 0
          ? merged.startDate
          : this.calculator.next(
              current.lastGeneratedDate ?? current.startDate,
              merged.schedule,
            );
    }
    const completed =
      nextOccurrenceDate === null ||
      !this.calculator.withinLimits(
        nextOccurrenceDate,
        merged.schedule,
        current.generatedCount,
      );
    const nextStatus =
      completed
        ? RecurrenceStatus.COMPLETED
        : current.status === RecurrenceStatus.COMPLETED
          ? RecurrenceStatus.ACTIVE
          : current.status;

    await this.prisma.$transaction(async (transaction) => {
      await transaction.recurrenceRule.update({
        where: { id },
        data: {
          name: dto.name === undefined ? undefined : normalize(dto.name),
          description: dto.name === undefined ? undefined : normalize(dto.name),
          amount: dto.amount === undefined ? undefined : parseMoney(dto.amount),
          categoryId: dto.categoryId,
          merchant: optionalPlainText(dto.merchant),
          paymentMethod: dto.paymentMethod,
          notes: optionalPlainText(dto.notes),
          frequency: dto.frequency,
          interval: dto.interval,
          startDate: dto.startDate === undefined ? undefined : merged.startDate,
          endDate: dto.endDate === undefined ? undefined : merged.endDate,
          maxOccurrences: dto.maxOccurrences === undefined ? undefined : dto.maxOccurrences,
          expenseTime: parseExpenseTime(dto.expenseTime),
          generateDaysAhead: dto.generateDaysAhead,
          nextOccurrenceDate: completed ? null : nextOccurrenceDate,
          status: nextStatus,
          completedAt: completed ? now : nextStatus === RecurrenceStatus.ACTIVE ? null : undefined,
          labels:
            dto.labelIds === undefined
              ? undefined
              : {
                  deleteMany: {},
                  create: merged.labelIds.map((labelId) => ({ labelId })),
                },
          reminderTemplates:
            dto.reminderTemplates === undefined
              ? undefined
              : {
                  deleteMany: {},
                  create: merged.templates.map((template) => ({
                    type: template.type,
                    offsetMinutes: reminderOffset(template.type),
                    reminderTime: parseExpenseTime(template.reminderTime) ?? null,
                  })),
                },
        },
      });
      if (dto.updateScope === RecurrenceUpdateScope.RULE_AND_FUTURE_PLANNED_EXPENSES) {
        await this.updateFutureExpenses(transaction, current, dto, merged, now);
      }
    }, { timeout: 20_000 });

    if (nextStatus === RecurrenceStatus.ACTIVE) {
      await this.generator.generateRule(id, now, this.maximumPerRun);
    }
    return this.findOne(userId, id);
  }

  async pause(
    userId: string,
    id: string,
    dto: PauseRecurrenceDto,
    now = new Date(),
  ): Promise<RecurrenceResponse> {
    const rule = await this.findOwned(userId, id);
    if (rule.status !== RecurrenceStatus.ACTIVE) {
      throw new ConflictException('È possibile sospendere soltanto una ricorrenza attiva');
    }
    await this.prisma.$transaction(async (transaction) => {
      await transaction.recurrenceRule.update({
        where: { id },
        data: { status: RecurrenceStatus.PAUSED, pausedAt: now },
      });
      if (dto.cancelFutureExpenses) {
        await this.cancelFutureExpenses(transaction, userId, id, now);
      }
    });
    return this.findOne(userId, id);
  }

  async resume(userId: string, id: string, now = new Date()): Promise<RecurrenceResponse> {
    const rule = await this.findOwned(userId, id);
    if (rule.status !== RecurrenceStatus.PAUSED) {
      throw new ConflictException('È possibile riattivare soltanto una ricorrenza in pausa');
    }
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });
    const today = localDateOnly(now, user.timezone);
    const schedule = scheduleOf(rule);
    const candidate = this.calculator.firstOnOrAfter(
      rule.nextOccurrenceDate ?? rule.startDate,
      today,
      schedule,
    );
    const canContinue =
      candidate !== null &&
      this.calculator.withinLimits(candidate, schedule, rule.generatedCount);
    await this.prisma.recurrenceRule.update({
      where: { id },
      data: {
        status: canContinue ? RecurrenceStatus.ACTIVE : RecurrenceStatus.COMPLETED,
        nextOccurrenceDate: canContinue ? candidate : null,
        pausedAt: null,
        completedAt: canContinue ? null : now,
      },
    });
    if (canContinue) await this.generator.generateRule(id, now, this.maximumPerRun);
    return this.findOne(userId, id);
  }

  async cancel(
    userId: string,
    id: string,
    dto: CancelRecurrenceDto,
    now = new Date(),
  ): Promise<RecurrenceResponse> {
    const rule = await this.findOwned(userId, id);
    if (
      rule.status === RecurrenceStatus.CANCELLED ||
      rule.status === RecurrenceStatus.COMPLETED
    ) {
      throw new ConflictException('La ricorrenza è già conclusa');
    }
    await this.prisma.$transaction(async (transaction) => {
      await transaction.recurrenceRule.update({
        where: { id },
        data: {
          status: RecurrenceStatus.CANCELLED,
          cancelledAt: now,
          pausedAt: null,
          nextOccurrenceDate: null,
        },
      });
      if (dto.cancelFutureExpenses) {
        await this.cancelFutureExpenses(transaction, userId, id, now);
      }
    });
    return this.findOne(userId, id);
  }

  async remove(userId: string, id: string, now = new Date()): Promise<{ deleted: true }> {
    const rule = await this.findOwned(userId, id);
    if (rule.generatedCount > 0 || rule._count.expenses > 0) {
      throw new ConflictException(
        'Una ricorrenza già utilizzata deve essere terminata, non eliminata',
      );
    }
    await this.prisma.recurrenceRule.update({
      where: { id },
      data: {
        status: RecurrenceStatus.CANCELLED,
        cancelledAt: now,
        deletedAt: now,
        nextOccurrenceDate: null,
      },
    });
    return { deleted: true };
  }

  async skipOccurrence(
    userId: string,
    id: string,
    dto: CreateRecurrenceExceptionDto,
    now = new Date(),
  ): Promise<RecurrenceResponse> {
    const rule = await this.findOwned(userId, id);
    const occurrenceDate = parseExpenseDate(dto.occurrenceDate, 'occurrenceDate');
    const schedule = scheduleOf(rule);
    if (!this.calculator.isOccurrenceDate(occurrenceDate, schedule)) {
      throw new BadRequestException('La data indicata non appartiene alla ricorrenza');
    }
    if (rule.nextOccurrenceDate && occurrenceDate < rule.nextOccurrenceDate) {
      throw new ConflictException('L’occorrenza è già stata elaborata');
    }
    const existingExpense = await this.prisma.expense.findUnique({
      where: {
        recurrenceRuleId_occurrenceDate: {
          recurrenceRuleId: id,
          occurrenceDate,
        },
      },
      select: { id: true },
    });
    if (existingExpense) throw new ConflictException('L’occorrenza è già stata generata');
    try {
      await this.prisma.recurrenceException.create({
        data: {
          recurrenceRuleId: id,
          occurrenceDate,
          reason: optionalPlainText(dto.reason),
        },
      });
    } catch (error) {
      if (isUniqueConflict(error)) throw new ConflictException('L’occorrenza è già esclusa');
      throw error;
    }
    if (rule.status === RecurrenceStatus.ACTIVE) {
      await this.generator.generateRule(id, now, this.maximumPerRun);
    }
    return this.findOne(userId, id);
  }

  private async validatedInput(userId: string, dto: CreateRecurrenceDto) {
    await this.validateCategory(userId, dto.categoryId, true);
    const labelIds = dto.labelIds ?? [];
    await this.validateLabels(userId, labelIds);
    const startDate = parseExpenseDate(dto.startDate, 'startDate');
    const endDate = dto.endDate ? parseExpenseDate(dto.endDate, 'endDate') : null;
    this.validateDateRange(startDate, endDate);
    this.validateHorizon(dto.generateDaysAhead ?? this.defaultGenerationDays);
    const templates = this.validateTemplates(dto.reminderTemplates ?? []);
    return { startDate, endDate, labelIds, templates };
  }

  private async validatedMergedInput(
    userId: string,
    current: RecurrenceWithRelations,
    dto: UpdateRecurrenceDto,
  ) {
    const categoryId = dto.categoryId ?? current.categoryId;
    await this.validateCategory(userId, categoryId, dto.categoryId !== undefined);
    const labelIds = dto.labelIds ?? current.labels.map(({ labelId }) => labelId);
    await this.validateLabels(userId, labelIds);
    const startDate = dto.startDate
      ? parseExpenseDate(dto.startDate, 'startDate')
      : current.startDate;
    const endDate =
      dto.endDate === undefined
        ? current.endDate
        : dto.endDate
          ? parseExpenseDate(dto.endDate, 'endDate')
          : null;
    this.validateDateRange(startDate, endDate);
    this.validateHorizon(dto.generateDaysAhead ?? current.generateDaysAhead);
    const templates = this.validateTemplates(
      dto.reminderTemplates ??
        current.reminderTemplates.map((template) => ({
          type: template.type,
          reminderTime: template.reminderTime
            ? template.reminderTime.toISOString().slice(11, 16)
            : null,
        })),
    );
    return {
      startDate,
      endDate,
      labelIds,
      templates,
      schedule: {
        frequency: dto.frequency ?? current.frequency,
        interval: dto.interval ?? current.interval,
        startDate,
        endDate,
        maxOccurrences:
          dto.maxOccurrences === undefined ? current.maxOccurrences : dto.maxOccurrences,
      },
      categoryId,
    };
  }

  private async updateFutureExpenses(
    transaction: Prisma.TransactionClient,
    current: RecurrenceWithRelations,
    dto: UpdateRecurrenceDto,
    merged: Awaited<ReturnType<RecurrencesService['validatedMergedInput']>>,
    now: Date,
  ): Promise<void> {
    const user = await transaction.user.findUniqueOrThrow({
      where: { id: current.userId },
      select: { timezone: true },
    });
    const today = localDateOnly(now, user.timezone);
    const expenses = await transaction.expense.findMany({
      where: {
        recurrenceRuleId: current.id,
        status: ExpenseStatus.PLANNED,
        deletedAt: null,
        expenseDate: { gte: today },
      },
      select: { id: true, expenseDate: true, expenseTime: true },
    });
    if (expenses.length === 0) return;
    const expenseIds = expenses.map(({ id }) => id);
    await transaction.expense.updateMany({
      where: { id: { in: expenseIds } },
      data: {
        description: dto.name === undefined ? undefined : normalize(dto.name),
        amount: dto.amount === undefined ? undefined : parseMoney(dto.amount),
        categoryId: dto.categoryId,
        merchant: optionalPlainText(dto.merchant),
        paymentMethod: dto.paymentMethod,
        notes: optionalPlainText(dto.notes),
        expenseTime: parseExpenseTime(dto.expenseTime),
      },
    });
    if (dto.labelIds !== undefined) {
      await transaction.expenseLabel.deleteMany({ where: { expenseId: { in: expenseIds } } });
      if (merged.labelIds.length > 0) {
        await transaction.expenseLabel.createMany({
          data: expenseIds.flatMap((expenseId) =>
            merged.labelIds.map((labelId) => ({ expenseId, labelId })),
          ),
          skipDuplicates: true,
        });
      }
    }
    if (dto.reminderTemplates !== undefined || dto.expenseTime !== undefined) {
      await transaction.expenseReminder.deleteMany({
        where: {
          expenseId: { in: expenseIds },
          type: { not: ReminderType.CUSTOM },
          processedAt: null,
        },
      });
      for (const expense of expenses) {
        const time =
          dto.expenseTime === undefined
            ? expense.expenseTime
            : parseExpenseTime(dto.expenseTime) ?? null;
        for (const template of merged.templates) {
          const localTime =
            template.reminderTime ??
            (time ? time.toISOString().slice(11, 16) : this.defaultReminderTime);
          const deadline = localDateTimeToUtc(
            formatExpenseDate(expense.expenseDate),
            localTime,
            user.timezone,
          );
          const scheduledAt = new Date(
            deadline.getTime() - reminderOffset(template.type) * 60_000,
          );
          const active = scheduledAt >= now;
          await transaction.expenseReminder.upsert({
            where: {
              expenseId_type_scheduledAt: {
                expenseId: expense.id,
                type: template.type,
                scheduledAt,
              },
            },
            create: {
              userId: current.userId,
              expenseId: expense.id,
              type: template.type,
              offsetMinutes: reminderOffset(template.type),
              scheduledAt,
              isActive: active,
              cancelledAt: active ? null : now,
            },
            update: {
              offsetMinutes: reminderOffset(template.type),
              isActive: active,
              cancelledAt: active ? null : now,
            },
          });
        }
      }
    }
  }

  private async cancelFutureExpenses(
    transaction: Prisma.TransactionClient,
    userId: string,
    recurrenceRuleId: string,
    now: Date,
  ): Promise<void> {
    const user = await transaction.user.findUniqueOrThrow({
      where: { id: userId },
      select: { timezone: true },
    });
    const today = localDateOnly(now, user.timezone);
    const expenses = await transaction.expense.findMany({
      where: {
        userId,
        recurrenceRuleId,
        status: ExpenseStatus.PLANNED,
        deletedAt: null,
        expenseDate: { gte: today },
      },
      select: { id: true },
    });
    const ids = expenses.map(({ id }) => id);
    if (ids.length === 0) return;
    await transaction.expense.updateMany({
      where: { id: { in: ids }, status: ExpenseStatus.PLANNED },
      data: { status: ExpenseStatus.CANCELLED },
    });
    await transaction.expenseReminder.updateMany({
      where: { expenseId: { in: ids }, isActive: true, processedAt: null },
      data: { isActive: false, cancelledAt: now },
    });
  }

  private previewForRule(rule: RecurrenceWithRelations, limit: number): Date[] {
    if (!rule.nextOccurrenceDate) return [];
    return this.calculator.preview(
      rule.nextOccurrenceDate,
      scheduleOf(rule),
      limit,
      rule.generatedCount,
    );
  }

  private buildWhere(
    userId: string,
    query: RecurrenceQueryDto,
  ): Prisma.RecurrenceRuleWhereInput {
    return {
      userId,
      deletedAt: null,
      status: query.status,
      frequency: query.frequency,
      categoryId: query.categoryId,
      paymentMethod: query.paymentMethod,
      OR: query.search
        ? [
            { name: { contains: query.search } },
            { notes: { contains: query.search } },
            { merchant: { contains: query.search } },
          ]
        : undefined,
    };
  }

  private async findOwned(userId: string, id: string): Promise<RecurrenceWithRelations> {
    const rule = await this.prisma.recurrenceRule.findFirst({
      where: { id, userId, deletedAt: null },
      include: recurrenceInclude,
    });
    if (!rule) throw new NotFoundException('Ricorrenza non trovata');
    return rule;
  }

  private async validateCategory(
    userId: string,
    id: string,
    requireActive: boolean,
  ): Promise<void> {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [{ userId: null, isDefault: true }, { userId }],
      },
      include: { preferences: { where: { userId } } },
    });
    if (!category) throw new BadRequestException('La categoria selezionata non è disponibile');
    const active = category.preferences[0]?.isActive ?? category.isActive;
    if (requireActive && !active) {
      throw new BadRequestException('La categoria selezionata non è attiva');
    }
  }

  private async validateLabels(userId: string, ids: string[]): Promise<void> {
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException('Le etichette non possono essere duplicate');
    }
    if (ids.length === 0) return;
    const count = await this.prisma.label.count({
      where: { id: { in: ids }, userId, deletedAt: null, isActive: true },
    });
    if (count !== ids.length) {
      throw new BadRequestException('Una o più etichette non sono valide');
    }
  }

  private validateTemplates(
    templates: RecurrenceReminderTemplateDto[],
  ): RecurrenceReminderTemplateDto[] {
    const seen = new Set<ReminderType>();
    for (const template of templates) {
      if (template.type === ReminderType.CUSTOM) {
        throw new BadRequestException(
          'I template ricorrenti non supportano date personalizzate assolute',
        );
      }
      if (seen.has(template.type)) {
        throw new BadRequestException('I template promemoria non possono essere duplicati');
      }
      seen.add(template.type);
    }
    return templates;
  }

  private validateDateRange(start: Date, end: Date | null): void {
    if (end && end < start) {
      throw new BadRequestException('La data di fine non può precedere la data iniziale');
    }
  }

  private validateHorizon(days: number): void {
    if (!Number.isInteger(days) || days < 1 || days > this.maximumGenerationDays) {
      throw new BadRequestException(
        `L'orizzonte deve essere compreso tra 1 e ${this.maximumGenerationDays} giorni`,
      );
    }
  }
}

function scheduleOf(rule: RecurrenceWithRelations) {
  return {
    frequency: rule.frequency,
    interval: rule.interval,
    startDate: rule.startDate,
    endDate: rule.endDate,
    maxOccurrences: rule.maxOccurrences,
  };
}

function normalize(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function pagination(page: number, pageSize: number, totalItems: number): RecurrencePaginationMeta {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize),
  };
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
