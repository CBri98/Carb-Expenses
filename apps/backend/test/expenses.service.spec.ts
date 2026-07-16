import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpenseStatus, PaymentMethod, Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { dateOnly, romeCalendarDate } from '../src/dashboard/dashboard.utils';
import { ExpenseQueryDto } from '../src/expenses/dto/expense.dto';
import { ExpensesService } from '../src/expenses/expenses.service';
import type { ExpenseWithRelations } from '../src/expenses/expenses.types';
import { PrismaService } from '../src/prisma/prisma.service';

const category = {
  id: '10000000-0000-4000-8000-000000000001', userId: null, name: 'Casa', slug: 'casa',
  description: null, icon: 'bi-house', color: '#4F46E5', sortOrder: 1,
  isDefault: true, isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
};
const label = {
  id: '20000000-0000-4000-8000-000000000001', userId: 'user-1', categoryId: null,
  name: 'Condivisa', slug: 'condivisa', description: null, color: '#2563EB', icon: 'bi-people',
  sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date(), deletedAt: null,
};

function expense(overrides: Partial<ExpenseWithRelations> = {}): ExpenseWithRelations {
  return {
    id: '30000000-0000-4000-8000-000000000001', userId: 'user-1', categoryId: category.id,
    description: 'Spesa test', amount: new Prisma.Decimal('42.50'),
    expenseDate: new Date('2026-07-14T00:00:00.000Z'), expenseTime: null,
    merchant: 'Negozio', paymentMethod: PaymentMethod.DEBIT_CARD, notes: null,
    status: ExpenseStatus.COMPLETED, createdAt: new Date('2026-07-14T08:00:00.000Z'),
    updatedAt: new Date('2026-07-14T08:00:00.000Z'), deletedAt: null,
    category, labels: [{ expenseId: '30000000-0000-4000-8000-000000000001', labelId: label.id, label }],
    ...overrides,
  };
}

describe('ExpensesService', () => {
  let prisma: ReturnType<typeof prismaMock>;
  let service: ExpensesService;

  beforeEach(() => {
    prisma = prismaMock();
    service = new ExpensesService(prisma as unknown as PrismaService);
    prisma.category.findFirst.mockResolvedValue({ ...category, preferences: [] });
    prisma.label.findMany.mockResolvedValue([{ id: label.id, isActive: true }]);
  });

  it('crea una spesa valida con importo Decimal e relazioni', async () => {
    prisma.expense.create.mockResolvedValue(expense());
    const result = await service.create('user-1', {
      description: '  Spesa   test ', amount: '42.50', expenseDate: '2026-07-14',
      categoryId: category.id, labelIds: [label.id], paymentMethod: PaymentMethod.DEBIT_CARD,
      status: ExpenseStatus.COMPLETED,
    });
    expect(prisma.expense.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'user-1', description: 'Spesa test', amount: new Prisma.Decimal('42.50'),
        labels: { create: [{ labelId: label.id }] },
      }),
    }));
    expect(result.amount).toBe('42.50');
  });

  it('rifiuta data semanticamente non valida', async () => {
    await expect(service.create('user-1', {
      description: 'Test', amount: '10.00', expenseDate: '2026-02-31', categoryId: category.id,
      paymentMethod: PaymentMethod.CASH, status: ExpenseStatus.COMPLETED,
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rifiuta categoria inesistente, altrui o disattivata', async () => {
    prisma.category.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      ...category, isActive: false, preferences: [],
    });
    const dto = {
      description: 'Test', amount: '10.00', expenseDate: '2026-07-14', categoryId: category.id,
      paymentMethod: PaymentMethod.CASH, status: ExpenseStatus.COMPLETED,
    };
    await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rifiuta etichette non appartenenti all’utente', async () => {
    prisma.label.findMany.mockResolvedValue([]);
    await expect(service.create('user-1', {
      description: 'Test', amount: '10.00', expenseDate: '2026-07-14', categoryId: category.id,
      labelIds: [label.id], paymentMethod: PaymentMethod.CASH, status: ExpenseStatus.COMPLETED,
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('applica paginazione, ricerca, filtri e ordinamento server-side', async () => {
    prisma.expense.count.mockResolvedValue(43);
    prisma.expense.findMany.mockResolvedValue([expense()]);
    const query = Object.assign(new ExpenseQueryDto(), {
      page: 2, pageSize: 20, search: 'negozio', categoryId: category.id,
      labelIds: [label.id], status: ExpenseStatus.COMPLETED,
      paymentMethod: PaymentMethod.DEBIT_CARD, minAmount: '10.00', maxAmount: '100.00',
      sortBy: 'amount' as const, sortDirection: 'asc' as const,
    });
    const result = await service.findAll('user-1', query);
    expect(prisma.expense.findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 20, take: 20,
      where: expect.objectContaining({
        userId: 'user-1', deletedAt: null, categoryId: category.id,
        labels: { some: { labelId: { in: [label.id] } } },
      }),
      orderBy: expect.arrayContaining([{ amount: 'asc' }]),
    }));
    expect(result.meta).toMatchObject({ page: 2, totalItems: 43, totalPages: 3 });
  });

  it('costruisce correttamente il filtro mensile senza caricare tutto', async () => {
    prisma.expense.count.mockResolvedValue(0);
    prisma.expense.findMany.mockResolvedValue([]);
    await service.findAll('user-1', Object.assign(new ExpenseQueryDto(), { month: 7, year: 2026 }));
    expect(prisma.expense.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        expenseDate: {
          gte: new Date('2026-07-01T00:00:00.000Z'),
          lt: new Date('2026-08-01T00:00:00.000Z'),
        },
      }),
    }));
  });

  it('esclude le date future quando la preferenza lo richiede', async () => {
    prisma.expense.count.mockResolvedValue(0);
    prisma.expense.findMany.mockResolvedValue([]);
    await service.findAll('user-1', Object.assign(new ExpenseQueryDto(), {
      includeFuture: false,
    }));
    const request = prisma.expense.findMany.mock.calls.at(-1)?.[0];
    const current = romeCalendarDate();
    expect(request?.where?.expenseDate).toEqual({
      lte: dateOnly(current.year, current.month, current.day),
    });
  });

  it('rifiuta filtri temporali o monetari ambigui', async () => {
    await expect(service.findAll('user-1', Object.assign(new ExpenseQueryDto(), {
      month: 7, year: 2026, dateFrom: '2026-07-01',
    }))).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.findAll('user-1', Object.assign(new ExpenseQueryDto(), {
      minAmount: '20.00', maxAmount: '10.00',
    }))).rejects.toBeInstanceOf(BadRequestException);
  });

  it('restituisce 404 per spesa altrui, inesistente o eliminata', async () => {
    prisma.expense.findFirst.mockResolvedValue(null);
    await expect(service.findOne('user-2', expense().id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('modifica la spesa sostituendo le etichette in transazione', async () => {
    prisma.expense.findFirst.mockResolvedValue(expense());
    prisma.expense.update.mockResolvedValue(expense({ description: 'Aggiornata' }));
    await service.update('user-1', expense().id, { description: 'Aggiornata', labelIds: [] });
    expect(prisma.expense.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ labels: { deleteMany: {}, create: [] } }),
    }));
  });

  it('cambia stato e applica soft delete', async () => {
    prisma.expense.findFirst.mockResolvedValue(expense());
    prisma.expense.update
      .mockResolvedValueOnce(expense({ status: ExpenseStatus.PLANNED }))
      .mockResolvedValueOnce(expense({ deletedAt: new Date() }));
    const updated = await service.setStatus('user-1', expense().id, ExpenseStatus.PLANNED);
    expect(updated.status).toBe(ExpenseStatus.PLANNED);
    await expect(service.remove('user-1', expense().id)).resolves.toEqual({ deleted: true });
    expect(prisma.expense.update).toHaveBeenLastCalledWith({
      where: { id: expense().id }, data: { deletedAt: expect.any(Date) },
    });
  });

  it('duplica usando una nuova data e un nuovo ID generato dal database', async () => {
    prisma.expense.findFirst.mockResolvedValue(expense());
    prisma.expense.create.mockResolvedValue(expense({
      id: '30000000-0000-4000-8000-000000000002',
      expenseDate: new Date('2026-07-20T00:00:00.000Z'),
    }));
    const copy = await service.duplicate('user-1', expense().id, { expenseDate: '2026-07-20' });
    expect(copy.id).not.toBe(expense().id);
    expect(copy.expenseDate).toBe('2026-07-20');
  });

  it('esporta CSV UTF-8 filtrato e limitato all’utente', async () => {
    prisma.expense.findMany.mockResolvedValue([expense()]);
    const csv = await service.exportCsv('user-1', Object.assign(new ExpenseQueryDto(), {
      search: 'Spesa', month: 7, year: 2026,
    }));
    expect(prisma.expense.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: 'user-1', deletedAt: null }), take: 10_000,
    }));
    expect(csv.content.startsWith('\uFEFF')).toBe(true);
    expect(csv.content).toContain('"Data";"Ora";"Descrizione"');
    expect(csv.content).toContain('"Spesa test"');
    expect(csv.filename).toBe('spese-2026-07.csv');
  });
});

function prismaMock() {
  const mock = {
    expense: {
      create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn(), count: vi.fn(), update: vi.fn(),
    },
    category: { findFirst: vi.fn() },
    label: { findMany: vi.fn() },
    $transaction: vi.fn(),
  };
  mock.$transaction.mockImplementation((argument: unknown) => {
    if (Array.isArray(argument)) return Promise.all(argument);
    return Promise.resolve((argument as (transaction: typeof mock) => unknown)(mock));
  });
  return mock;
}
