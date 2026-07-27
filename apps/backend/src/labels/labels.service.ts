import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesService } from '../categories/categories.service';
import { catalogSlug, normalizeCatalogName, optionalText } from '../common/utils/catalog.utils';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabelDto, LabelQueryDto, ReorderLabelsDto, UpdateLabelDto } from './dto/label.dto';
import type { LabelResponse, LabelSummary, LabelWithCategory } from './label.types';

@Injectable()
export class LabelsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categories: CategoriesService,
  ) {}

  async findAll(userId: string, query: LabelQueryDto): Promise<LabelResponse[]> {
    const rows = await this.prisma.label.findMany({
      where: {
        userId,
        deletedAt: null,
        categoryId: query.categoryId,
        isActive: query.active,
        OR: query.search?.trim()
          ? [
              { name: { contains: query.search.trim() } },
              { description: { contains: query.search.trim() } },
            ]
          : undefined,
      },
      include: { category: true },
      orderBy: { [query.sortBy ?? 'sortOrder']: query.sortDirection ?? 'asc' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async findOne(userId: string, id: string): Promise<LabelResponse> {
    return this.toResponse(await this.findOwned(userId, id));
  }

  async summary(userId: string, query: LabelQueryDto): Promise<LabelSummary> {
    const items = await this.findAll(userId, query);
    if (items.length === 0) {
      return { total: 0, withCategory: 0, withoutCategory: 0, unused: 0 };
    }
    const used = await this.prisma.expenseLabel.groupBy({
      by: ['labelId'],
      where: {
        labelId: { in: items.map((item) => item.id) },
        expense: { userId, deletedAt: null },
      },
      _count: { _all: true },
    });
    const usedIds = new Set(used.map((item) => item.labelId));
    return {
      total: items.length,
      withCategory: items.filter((item) => item.categoryId !== null).length,
      withoutCategory: items.filter((item) => item.categoryId === null).length,
      unused: items.filter((item) => !usedIds.has(item.id)).length,
    };
  }

  async create(userId: string, dto: CreateLabelDto): Promise<LabelResponse> {
    const name = normalizeCatalogName(dto.name);
    const slug = catalogSlug(name);
    await this.ensureUnique(userId, slug);
    if (dto.categoryId) await this.categories.assertAccessible(userId, dto.categoryId);
    const max = await this.prisma.label.aggregate({
      where: { userId, deletedAt: null },
      _max: { sortOrder: true },
    });
    const row = await this.prisma.label.create({
      data: {
        userId,
        name,
        slug,
        description: optionalText(dto.description),
        color: dto.color.toUpperCase(),
        icon: optionalText(dto.icon),
        categoryId: dto.categoryId ?? null,
        sortOrder: dto.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
        isActive: dto.isActive ?? true,
      },
      include: { category: true },
    });
    return this.toResponse(row);
  }

  async update(userId: string, id: string, dto: UpdateLabelDto): Promise<LabelResponse> {
    const current = await this.findOwned(userId, id);
    const name = dto.name === undefined ? undefined : normalizeCatalogName(dto.name);
    const slug = name === undefined ? undefined : catalogSlug(name);
    if (slug && slug !== current.slug) await this.ensureUnique(userId, slug, id);
    if (dto.categoryId) await this.categories.assertAccessible(userId, dto.categoryId);
    const row = await this.prisma.label.update({
      where: { id },
      data: {
        name,
        slug,
        description: optionalText(dto.description),
        color: dto.color?.toUpperCase(),
        icon: optionalText(dto.icon),
        categoryId: dto.categoryId,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
      include: { category: true },
    });
    return this.toResponse(row);
  }

  async setStatus(userId: string, id: string, isActive: boolean): Promise<LabelResponse> {
    await this.findOwned(userId, id);
    const row = await this.prisma.label.update({
      where: { id },
      data: { isActive },
      include: { category: true },
    });
    return this.toResponse(row);
  }

  async remove(userId: string, id: string): Promise<{ deleted: true }> {
    await this.findOwned(userId, id);
    await this.prisma.label.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { deleted: true };
  }

  async reorder(userId: string, dto: ReorderLabelsDto): Promise<LabelResponse[]> {
    if (new Set(dto.items.map((item) => item.id)).size !== dto.items.length) {
      throw new ConflictException('Ogni etichetta può comparire una sola volta');
    }
    const owned = await this.prisma.label.findMany({
      where: { userId, deletedAt: null, id: { in: dto.items.map((item) => item.id) } },
      select: { id: true },
    });
    if (owned.length !== dto.items.length)
      throw new NotFoundException('Una o più etichette non sono accessibili');
    await this.prisma.$transaction(
      dto.items.map((item) =>
        this.prisma.label.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }),
      ),
    );
    return this.findAll(userId, new LabelQueryDto());
  }

  private async findOwned(userId: string, id: string): Promise<LabelWithCategory> {
    const label = await this.prisma.label.findFirst({
      where: { id, userId, deletedAt: null },
      include: { category: true },
    });
    if (!label) throw new NotFoundException('Etichetta non trovata');
    return label;
  }

  private async ensureUnique(userId: string, slug: string, excludeId?: string): Promise<void> {
    const duplicate = await this.prisma.label.findFirst({
      where: {
        userId,
        slug,
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined,
      },
    });
    if (duplicate) throw new ConflictException('Esiste già un’etichetta con questo nome');
  }

  private toResponse(row: LabelWithCategory): LabelResponse {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      color: row.color,
      icon: row.icon,
      categoryId: row.categoryId,
      category: row.category
        ? {
            id: row.category.id,
            name: row.category.name,
            color: row.category.color,
            icon: row.category.icon,
          }
        : null,
      sortOrder: row.sortOrder,
      isDefault: false,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
