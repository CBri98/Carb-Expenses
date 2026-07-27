import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Category, UserCategoryPreference } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CategoriesService } from '../src/categories/categories.service';
import { CategoryQueryDto } from '../src/categories/dto/category.dto';
import { PrismaService } from '../src/prisma/prisma.service';

const now = new Date('2026-07-14T08:00:00.000Z');

function category(overrides: Partial<Category> = {}): Category {
  return {
    id: '10000000-0000-4000-8000-000000000001',
    userId: null,
    name: 'Casa',
    slug: 'casa',
    description: null,
    icon: 'bi-house',
    color: '#4F46E5',
    sortOrder: 1,
    isDefault: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: ReturnType<typeof prismaMock>;

  beforeEach(() => {
    prisma = prismaMock();
    service = new CategoriesService(prisma as unknown as PrismaService);
  });

  it('unisce categorie predefinite e preferenze utente', async () => {
    const preference: UserCategoryPreference = {
      userId: 'user-1',
      categoryId: category().id,
      isActive: false,
      sortOrder: 8,
    };
    prisma.category.findMany.mockResolvedValue([{ ...category(), preferences: [preference] }]);

    const result = await service.findAll('user-1', new CategoryQueryDto());

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      name: 'Casa',
      isDefault: true,
      isActive: false,
      sortOrder: 8,
    });
  });

  it('calcola i contatori sulle sole categorie visibili e filtrate', async () => {
    prisma.category.findMany.mockResolvedValue([
      { ...category(), preferences: [] },
      { ...category({ id: '10000000-0000-4000-8000-000000000002', userId: 'user-1', isDefault: false, isActive: false }), preferences: [] },
    ]);
    await expect(service.summary('user-1', new CategoryQueryDto())).resolves.toEqual({
      total: 2, active: 1, inactive: 1, custom: 1,
    });
  });

  it('normalizza e crea una categoria personale', async () => {
    const created = category({
      id: '10000000-0000-4000-8000-000000000002',
      userId: 'user-1',
      name: 'Casa nuova',
      slug: 'casa-nuova',
      color: '#2563EB',
      icon: 'bi-house-door',
      isDefault: false,
    });
    prisma.category.findFirst.mockResolvedValue(null);
    prisma.category.aggregate.mockResolvedValue({ _max: { sortOrder: 4 } });
    prisma.category.create.mockResolvedValue(created);

    const result = await service.create('user-1', {
      name: '  Casa   nuova ',
      color: '#2563eb',
      icon: 'bi-house-door',
    });

    expect(prisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          name: 'Casa nuova',
          slug: 'casa-nuova',
          color: '#2563EB',
          sortOrder: 5,
        }),
      }),
    );
    expect(result.isCustom).toBe(true);
  });

  it('rifiuta un nome duplicato anche se cambia maiuscole o spazi', async () => {
    prisma.category.findFirst.mockResolvedValue(category());

    await expect(
      service.create('user-1', {
        name: ' CASA ',
        color: '#2563EB',
        icon: 'bi-house',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('impedisce la modifica di una categoria predefinita', async () => {
    prisma.category.findFirst.mockResolvedValue(category());

    await expect(
      service.update('user-1', category().id, { name: 'Nuovo nome' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('non espone categorie personali di altri utenti', async () => {
    prisma.category.findFirst.mockResolvedValue(null);

    await expect(
      service.update('user-1', category().id, { name: 'Nuovo nome' }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('salva lo stato di una categoria predefinita nella preferenza utente', async () => {
    const global = category();
    prisma.category.findFirst.mockResolvedValue(global);
    prisma.category.findMany.mockResolvedValue([
      {
        ...global,
        preferences: [{ userId: 'user-1', categoryId: global.id, isActive: false, sortOrder: 1 }],
      },
    ]);

    const result = await service.setStatus('user-1', global.id, false);

    expect(prisma.userCategoryPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          userId: 'user-1',
          categoryId: global.id,
          isActive: false,
        }),
      }),
    );
    expect(result.isActive).toBe(false);
  });

  it('applica soft delete a una categoria personale non usata', async () => {
    const custom = category({ userId: 'user-1', isDefault: false });
    prisma.category.findFirst.mockResolvedValue(custom);
    prisma.label.count.mockResolvedValue(0);

    await expect(service.remove('user-1', custom.id)).resolves.toEqual({ deleted: true });
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: custom.id },
      data: { deletedAt: expect.any(Date), isActive: false },
    });
  });

  it('riordina in transazione categorie globali e personali', async () => {
    const global = category();
    const custom = category({
      id: '10000000-0000-4000-8000-000000000002',
      userId: 'user-1',
      isDefault: false,
    });
    prisma.category.findFirst.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve(where.id === global.id ? global : custom),
    );
    prisma.category.findMany.mockResolvedValue([]);

    await service.reorder('user-1', {
      items: [
        { id: global.id, sortOrder: 2 },
        { id: custom.id, sortOrder: 1 },
      ],
    });

    expect(prisma.userCategoryPreference.upsert).toHaveBeenCalled();
    expect(prisma.category.update).toHaveBeenCalledWith({
      where: { id: custom.id },
      data: { sortOrder: 1 },
    });
  });
});

function prismaMock() {
  const mock = {
    category: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    userCategoryPreference: { upsert: vi.fn() },
    label: { count: vi.fn() },
    expense: { count: vi.fn() },
    $transaction: vi.fn(),
  };
  mock.$transaction.mockImplementation((argument: unknown) => {
    if (Array.isArray(argument)) return Promise.all(argument);
    return Promise.resolve((argument as (transaction: typeof mock) => unknown)(mock));
  });
  return mock;
}
