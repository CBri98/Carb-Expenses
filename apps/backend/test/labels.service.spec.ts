import { ConflictException, NotFoundException } from '@nestjs/common';
import type { Category, Label } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CategoriesService } from '../src/categories/categories.service';
import { LabelQueryDto } from '../src/labels/dto/label.dto';
import { LabelsService } from '../src/labels/labels.service';
import { PrismaService } from '../src/prisma/prisma.service';

const now = new Date('2026-07-14T08:00:00.000Z');
const category: Category = {
  id: '10000000-0000-4000-8000-000000000001',
  userId: null,
  name: 'Lavoro',
  slug: 'lavoro',
  description: null,
  icon: 'bi-briefcase',
  color: '#0369A1',
  sortOrder: 1,
  isDefault: true,
  isActive: true,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
};

function label(overrides: Partial<Label> = {}): Label {
  return {
    id: '20000000-0000-4000-8000-000000000001',
    userId: 'user-1',
    categoryId: category.id,
    name: 'Pranzo di lavoro',
    slug: 'pranzo-di-lavoro',
    description: null,
    color: '#F59E0B',
    icon: 'bi-briefcase',
    sortOrder: 1,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

describe('LabelsService', () => {
  let service: LabelsService;
  let prisma: ReturnType<typeof prismaMock>;
  let categories: { assertAccessible: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = prismaMock();
    categories = { assertAccessible: vi.fn().mockResolvedValue(category) };
    service = new LabelsService(
      prisma as unknown as PrismaService,
      categories as unknown as CategoriesService,
    );
  });

  it('crea una etichetta con categoria accessibile', async () => {
    prisma.label.findFirst.mockResolvedValue(null);
    prisma.label.aggregate.mockResolvedValue({ _max: { sortOrder: 2 } });
    prisma.label.create.mockResolvedValue({ ...label({ sortOrder: 3 }), category });

    const result = await service.create('user-1', {
      name: '  Pranzo   di lavoro ',
      color: '#f59e0b',
      icon: 'bi-briefcase',
      categoryId: category.id,
    });

    expect(categories.assertAccessible).toHaveBeenCalledWith('user-1', category.id);
    expect(prisma.label.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Pranzo di lavoro',
          slug: 'pranzo-di-lavoro',
          sortOrder: 3,
        }),
      }),
    );
    expect(result.category?.name).toBe('Lavoro');
  });

  it('rifiuta una categoria non accessibile', async () => {
    prisma.label.findFirst.mockResolvedValue(null);
    categories.assertAccessible.mockRejectedValue(new NotFoundException());

    await expect(
      service.create('user-1', {
        name: 'Privata',
        color: '#2563EB',
        categoryId: category.id,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.label.create).not.toHaveBeenCalled();
  });

  it('rifiuta duplicati case-insensitive tramite slug normalizzato', async () => {
    prisma.label.findFirst.mockResolvedValue({ ...label(), category });

    await expect(
      service.create('user-1', {
        name: 'PRANZO DI LAVORO',
        color: '#F59E0B',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('isola le etichette tra utenti', async () => {
    prisma.label.findFirst.mockResolvedValue(null);

    await expect(service.findOne('user-2', label().id)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('filtra per categoria e utente', async () => {
    prisma.label.findMany.mockResolvedValue([{ ...label(), category }]);
    const query = new LabelQueryDto();
    query.categoryId = category.id;

    const result = await service.findAll('user-1', query);

    expect(prisma.label.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-1',
          categoryId: category.id,
          deletedAt: null,
        }),
      }),
    );
    expect(result).toHaveLength(1);
  });

  it('applica soft delete', async () => {
    prisma.label.findFirst.mockResolvedValue({ ...label(), category });

    await expect(service.remove('user-1', label().id)).resolves.toEqual({ deleted: true });
    expect(prisma.label.update).toHaveBeenCalledWith({
      where: { id: label().id },
      data: { deletedAt: expect.any(Date), isActive: false },
    });
  });

  it('riordina soltanto etichette appartenenti all’utente', async () => {
    prisma.label.findMany.mockResolvedValueOnce([{ id: label().id }]).mockResolvedValueOnce([]);
    prisma.label.update.mockResolvedValue(label());

    await service.reorder('user-1', { items: [{ id: label().id, sortOrder: 4 }] });

    expect(prisma.label.update).toHaveBeenCalledWith({
      where: { id: label().id },
      data: { sortOrder: 4 },
    });
  });
});

function prismaMock() {
  const mock = {
    label: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  mock.$transaction.mockImplementation((operations: Array<Promise<unknown>>) =>
    Promise.all(operations),
  );
  return mock;
}
