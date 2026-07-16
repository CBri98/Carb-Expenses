import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ExpenseStatus, PaymentMethod, Prisma } from '@prisma/client';

import type { ApiPayload } from '../common/interceptors/api-response.interceptor';
import { dateOnly, romeCalendarDate } from '../dashboard/dashboard.utils';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateExpenseDto,
  DuplicateExpenseDto,
  ExpenseExportQueryDto,
  ExpenseQueryDto,
  UpdateExpenseDto,
} from './dto/expense.dto';
import { ExpenseMapper } from './expense.mapper';
import {
  formatExpenseDate,
  optionalPlainText,
  parseExpenseDate,
  parseExpenseTime,
  parseMoney,
} from './expense.utils';
import type {
  ExpenseCsvResult,
  ExpensePaginationMeta,
  ExpenseResponse,
  ExpenseWithRelations,
} from './expenses.types';

const expenseInclude = {
  category: true,
  labels: { include: { label: true } },
} satisfies Prisma.ExpenseInclude;

const paymentLabels: Record<PaymentMethod, string> = {
  CASH: 'Contanti',
  DEBIT_CARD: 'Carta di debito',
  CREDIT_CARD: 'Carta di credito',
  BANK_TRANSFER: 'Bonifico',
  DIRECT_DEBIT: 'Addebito diretto',
  DIGITAL_WALLET: 'Portafoglio digitale',
  CHECK: 'Assegno',
  OTHER: 'Altro',
};

const statusLabels: Record<ExpenseStatus, string> = {
  COMPLETED: 'Completata',
  PLANNED: 'Pianificata',
  CANCELLED: 'Annullata',
};

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateExpenseDto): Promise<ExpenseResponse> {
    await this.validateCategory(userId, dto.categoryId, true);
    const labelIds = dto.labelIds ?? [];
    await this.validateLabels(userId, labelIds, new Set(), true);

    const expense = await this.prisma.$transaction((transaction) =>
      transaction.expense.create({
        data: {
          userId,
          categoryId: dto.categoryId,
          description: normalizeDescription(dto.description),
          amount: parseMoney(dto.amount),
          expenseDate: parseExpenseDate(dto.expenseDate),
          expenseTime: parseExpenseTime(dto.expenseTime) ?? null,
          merchant: optionalPlainText(dto.merchant),
          paymentMethod: dto.paymentMethod,
          notes: optionalPlainText(dto.notes),
          status: dto.status,
          labels: { create: labelIds.map((labelId) => ({ labelId })) },
        },
        include: expenseInclude,
      }),
    );
    return ExpenseMapper.toResponse(expense);
  }

  async findAll(
    userId: string,
    query: ExpenseQueryDto,
  ): Promise<ApiPayload<ExpenseResponse[]>> {
    const where = this.buildWhere(userId, query);
    const orderBy = this.buildOrder(query.sortBy, query.sortDirection);
    const [totalItems, expenses] = await this.prisma.$transaction([
      this.prisma.expense.count({ where }),
      this.prisma.expense.findMany({
        where,
        include: expenseInclude,
        orderBy,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    const meta: ExpensePaginationMeta = {
      page: query.page,
      pageSize: query.pageSize,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize),
    };
    return {
      data: expenses.map((expense) => ExpenseMapper.toResponse(expense)),
      meta,
    };
  }

  async findOne(userId: string, id: string): Promise<ExpenseResponse> {
    return ExpenseMapper.toResponse(await this.findOwned(userId, id));
  }

  async update(userId: string, id: string, dto: UpdateExpenseDto): Promise<ExpenseResponse> {
    const current = await this.findOwned(userId, id);
    if (dto.categoryId !== undefined) {
      await this.validateCategory(userId, dto.categoryId, dto.categoryId !== current.categoryId);
    }
    if (dto.labelIds !== undefined) {
      const currentLabelIds = new Set(current.labels.map(({ labelId }) => labelId));
      await this.validateLabels(userId, dto.labelIds, currentLabelIds, false);
    }

    const data: Prisma.ExpenseUpdateInput = {
      description: dto.description === undefined ? undefined : normalizeDescription(dto.description),
      amount: dto.amount === undefined ? undefined : parseMoney(dto.amount),
      expenseDate: dto.expenseDate === undefined ? undefined : parseExpenseDate(dto.expenseDate),
      expenseTime: parseExpenseTime(dto.expenseTime),
      merchant: optionalPlainText(dto.merchant),
      paymentMethod: dto.paymentMethod,
      notes: optionalPlainText(dto.notes),
      status: dto.status,
      category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
      labels:
        dto.labelIds === undefined
          ? undefined
          : {
              deleteMany: {},
              create: dto.labelIds.map((labelId) => ({ labelId })),
            },
    };
    const expense = await this.prisma.$transaction((transaction) =>
      transaction.expense.update({
        where: { id },
        data,
        include: expenseInclude,
      }),
    );
    return ExpenseMapper.toResponse(expense);
  }

  async setStatus(userId: string, id: string, status: ExpenseStatus): Promise<ExpenseResponse> {
    await this.findOwned(userId, id);
    const expense = await this.prisma.expense.update({
      where: { id },
      data: { status },
      include: expenseInclude,
    });
    return ExpenseMapper.toResponse(expense);
  }

  async duplicate(
    userId: string,
    id: string,
    dto: DuplicateExpenseDto,
  ): Promise<ExpenseResponse> {
    const source = await this.findOwned(userId, id);
    const expense = await this.prisma.$transaction((transaction) =>
      transaction.expense.create({
        data: {
          userId,
          categoryId: source.categoryId,
          description: source.description,
          amount: source.amount,
          expenseDate: dto.expenseDate ? parseExpenseDate(dto.expenseDate) : source.expenseDate,
          expenseTime: source.expenseTime,
          merchant: source.merchant,
          paymentMethod: source.paymentMethod,
          notes: source.notes,
          status: source.status,
          labels: {
            create: source.labels.map(({ labelId }) => ({ labelId })),
          },
        },
        include: expenseInclude,
      }),
    );
    return ExpenseMapper.toResponse(expense);
  }

  async remove(userId: string, id: string): Promise<{ deleted: true }> {
    await this.findOwned(userId, id);
    await this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }

  async exportCsv(userId: string, query: ExpenseExportQueryDto): Promise<ExpenseCsvResult> {
    const expenses = await this.prisma.expense.findMany({
      where: this.buildWhere(userId, query),
      include: expenseInclude,
      orderBy: this.buildOrder(query.sortBy, query.sortDirection),
      take: 10_000,
    });
    const header = [
      'Data',
      'Ora',
      'Descrizione',
      'Importo',
      'Categoria',
      'Etichette',
      'Metodo di pagamento',
      'Esercente',
      'Stato',
      'Note',
    ];
    const rows = expenses.map((expense) => {
      const mapped = ExpenseMapper.toResponse(expense);
      return [
        mapped.expenseDate,
        mapped.expenseTime ?? '',
        mapped.description,
        mapped.amount.replace('.', ','),
        mapped.category.name,
        mapped.labels.map((label) => label.name).join(', '),
        paymentLabels[mapped.paymentMethod],
        mapped.merchant ?? '',
        statusLabels[mapped.status],
        mapped.notes ?? '',
      ];
    });
    const content = `\uFEFF${[header, ...rows]
      .map((row) => row.map((value) => csvCell(value)).join(';'))
      .join('\r\n')}\r\n`;
    const suffix =
      query.month && query.year
        ? `${query.year}-${String(query.month).padStart(2, '0')}`
        : formatExpenseDate(new Date());
    return { content, filename: `spese-${suffix}.csv` };
  }

  private async findOwned(userId: string, id: string): Promise<ExpenseWithRelations> {
    const expense = await this.prisma.expense.findFirst({
      where: { id, userId, deletedAt: null },
      include: expenseInclude,
    });
    if (!expense) throw new NotFoundException('Spesa non trovata');
    return expense;
  }

  private async validateCategory(userId: string, id: string, requireActive: boolean): Promise<void> {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [{ userId: null, isDefault: true }, { userId }],
      },
      include: { preferences: { where: { userId } } },
    });
    if (!category) throw new BadRequestException('La categoria selezionata non è disponibile');
    const isActive = category.preferences[0]?.isActive ?? category.isActive;
    if (requireActive && !isActive) {
      throw new BadRequestException('La categoria selezionata non è attiva');
    }
  }

  private async validateLabels(
    userId: string,
    ids: string[],
    currentIds: ReadonlySet<string>,
    requireAllActive: boolean,
  ): Promise<void> {
    if (ids.length === 0) return;
    const labels = await this.prisma.label.findMany({
      where: { id: { in: ids }, userId, deletedAt: null },
      select: { id: true, isActive: true },
    });
    const invalid =
      labels.length !== ids.length ||
      labels.some((label) => !label.isActive && (requireAllActive || !currentIds.has(label.id)));
    if (invalid) throw new BadRequestException('Una o più etichette non sono valide');
  }

  private buildWhere(
    userId: string,
    query: ExpenseQueryDto | ExpenseExportQueryDto,
  ): Prisma.ExpenseWhereInput {
    this.validateFilters(query);
    const dateFilter: Prisma.DateTimeFilter = {};
    if (query.dateFrom) dateFilter.gte = parseExpenseDate(query.dateFrom, 'dateFrom');
    const requestedEnd = query.dateTo ? parseExpenseDate(query.dateTo, 'dateTo') : undefined;
    if (query.includeFuture === false) {
      const current = romeCalendarDate();
      const today = dateOnly(current.year, current.month, current.day);
      dateFilter.lte = requestedEnd && requestedEnd < today ? requestedEnd : today;
    } else if (requestedEnd) {
      dateFilter.lte = requestedEnd;
    }
    if (query.month && query.year) {
      dateFilter.gte = new Date(Date.UTC(query.year, query.month - 1, 1));
      dateFilter.lt = new Date(Date.UTC(query.year, query.month, 1));
    }
    const amountFilter: Prisma.DecimalFilter = {};
    if (query.minAmount !== undefined) amountFilter.gte = parseMoney(query.minAmount);
    if (query.maxAmount !== undefined) amountFilter.lte = parseMoney(query.maxAmount);

    return {
      userId,
      deletedAt: null,
      expenseDate: Object.keys(dateFilter).length ? dateFilter : undefined,
      amount: Object.keys(amountFilter).length ? amountFilter : undefined,
      categoryId: query.categoryId,
      status: query.status,
      paymentMethod: query.paymentMethod,
      labels: query.labelIds?.length ? { some: { labelId: { in: query.labelIds } } } : undefined,
      OR: query.search
        ? [
            { description: { contains: query.search } },
            { merchant: { contains: query.search } },
            { notes: { contains: query.search } },
          ]
        : undefined,
    };
  }

  private validateFilters(query: ExpenseQueryDto | ExpenseExportQueryDto): void {
    if ((query.month === undefined) !== (query.year === undefined)) {
      throw new BadRequestException('Mese e anno devono essere indicati insieme');
    }
    if ((query.month !== undefined || query.year !== undefined) && (query.dateFrom || query.dateTo)) {
      throw new BadRequestException('Non combinare mese e anno con un intervallo di date');
    }
    if (query.dateFrom && query.dateTo) {
      const from = parseExpenseDate(query.dateFrom, 'dateFrom');
      const to = parseExpenseDate(query.dateTo, 'dateTo');
      if (from > to) throw new BadRequestException('La data iniziale non può superare la data finale');
    }
    if (query.minAmount !== undefined && query.maxAmount !== undefined) {
      if (parseMoney(query.minAmount).greaterThan(parseMoney(query.maxAmount))) {
        throw new BadRequestException("L'importo minimo non può superare quello massimo");
      }
    }
  }

  private buildOrder(
    sortBy: ExpenseQueryDto['sortBy'],
    direction: ExpenseQueryDto['sortDirection'],
  ): Prisma.ExpenseOrderByWithRelationInput[] {
    return [{ [sortBy]: direction }, { createdAt: 'desc' }, { id: 'desc' }];
  }
}

function normalizeDescription(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}
