import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Category } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { catalogSlug, normalizeCatalogName, optionalText } from '../common/utils/catalog.utils';
import {
  CategoryQueryDto,
  CreateCategoryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from './dto/category.dto';
import type { CategoryResponse, CategorySummary, CategoryWithPreferences } from './category.types';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, query: CategoryQueryDto): Promise<CategoryResponse[]> {
    const rows = await this.prisma.category.findMany({
      where: {
        deletedAt: null,
        OR: [{ userId: null, isDefault: true }, { userId }],
      },
      include: { preferences: { where: { userId } } },
    });
    const search = query.search?.trim().toLocaleLowerCase('it-IT');
    const direction = query.sortDirection === 'desc' ? -1 : 1;

    return rows
      .map((row) => this.toResponse(row))
      .filter(
        (row) =>
          !search ||
          `${row.name} ${row.description ?? ''}`.toLocaleLowerCase('it-IT').includes(search),
      )
      .filter((row) => query.active === undefined || row.isActive === query.active)
      .filter(
        (row) => query.type === 'all' || (query.type === 'default' ? row.isDefault : row.isCustom),
      )
      .sort((a, b) => {
        const field = query.sortBy ?? 'sortOrder';
        if (field === 'name') return a.name.localeCompare(b.name, 'it') * direction;
        if (field === 'createdAt')
          return (a.createdAt.getTime() - b.createdAt.getTime()) * direction;
        return (a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'it')) * direction;
      });
  }

  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryResponse> {
    const name = normalizeCatalogName(dto.name);
    const slug = catalogSlug(name);
    await this.ensureUnique(userId, slug);
    const max = await this.prisma.category.aggregate({
      where: { userId, deletedAt: null },
      _max: { sortOrder: true },
    });
    const row = await this.prisma.category.create({
      data: {
        userId,
        name,
        slug,
        description: optionalText(dto.description),
        color: dto.color.toUpperCase(),
        icon: dto.icon,
        sortOrder: dto.sortOrder ?? (max._max.sortOrder ?? 0) + 1,
        isDefault: false,
        isActive: dto.isActive ?? true,
      },
    });
    return this.toResponse({ ...row, preferences: [] });
  }

  async summary(userId: string, query: CategoryQueryDto): Promise<CategorySummary> {
    const items = await this.findAll(userId, query);
    return {
      total: items.length,
      active: items.filter((item) => item.isActive).length,
      inactive: items.filter((item) => !item.isActive).length,
      custom: items.filter((item) => item.isCustom).length,
    };
  }

  async update(userId: string, id: string, dto: UpdateCategoryDto): Promise<CategoryResponse> {
    const current = await this.findVisible(userId, id);
    if (current.isDefault)
      throw new ForbiddenException('Le categorie predefinite non possono essere modificate');
    if (current.userId !== userId) throw new NotFoundException('Categoria non trovata');
    const name = dto.name === undefined ? undefined : normalizeCatalogName(dto.name);
    const slug = name === undefined ? undefined : catalogSlug(name);
    if (slug && slug !== current.slug) await this.ensureUnique(userId, slug, id);
    const row = await this.prisma.category.update({
      where: { id },
      data: {
        name,
        slug,
        description: optionalText(dto.description),
        color: dto.color?.toUpperCase(),
        icon: dto.icon,
        sortOrder: dto.sortOrder,
        isActive: dto.isActive,
      },
    });
    return this.toResponse({ ...row, preferences: [] });
  }

  async setStatus(userId: string, id: string, isActive: boolean): Promise<CategoryResponse> {
    const current = await this.findVisible(userId, id);
    if (current.isDefault) {
      await this.prisma.userCategoryPreference.upsert({
        where: { userId_categoryId: { userId, categoryId: id } },
        create: { userId, categoryId: id, isActive, sortOrder: current.sortOrder },
        update: { isActive },
      });
    } else {
      if (current.userId !== userId) throw new NotFoundException('Categoria non trovata');
      await this.prisma.category.update({ where: { id }, data: { isActive } });
    }
    const list = await this.findAll(userId, new CategoryQueryDto());
    return list.find((item) => item.id === id)!;
  }

  async remove(userId: string, id: string): Promise<{ deleted: true }> {
    const current = await this.findVisible(userId, id);
    if (current.isDefault)
      throw new ForbiddenException('Le categorie predefinite non possono essere eliminate');
    if (current.userId !== userId) throw new NotFoundException('Categoria non trovata');
    const [labels, expenses] = await this.prisma.$transaction([
      this.prisma.label.count({ where: { categoryId: id, deletedAt: null } }),
      this.prisma.expense.count({ where: { categoryId: id } }),
    ]);
    if (labels > 0 || expenses > 0) {
      throw new ConflictException('La categoria è in uso e non può essere eliminata');
    }
    await this.prisma.category.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
    return { deleted: true };
  }

  async reorder(userId: string, dto: ReorderCategoriesDto): Promise<CategoryResponse[]> {
    if (new Set(dto.items.map((item) => item.id)).size !== dto.items.length) {
      throw new ConflictException('Ogni categoria può comparire una sola volta');
    }
    const visible = await Promise.all(dto.items.map((item) => this.findVisible(userId, item.id)));
    await this.prisma.$transaction(async (transaction) => {
      for (const [index, item] of dto.items.entries()) {
        const category = visible[index]!;
        if (category.isDefault) {
          await transaction.userCategoryPreference.upsert({
            where: { userId_categoryId: { userId, categoryId: item.id } },
            create: {
              userId,
              categoryId: item.id,
              isActive: category.isActive,
              sortOrder: item.sortOrder,
            },
            update: { sortOrder: item.sortOrder },
          });
        } else {
          await transaction.category.update({
            where: { id: item.id },
            data: { sortOrder: item.sortOrder },
          });
        }
      }
    });
    return this.findAll(userId, new CategoryQueryDto());
  }

  async assertAccessible(userId: string, id: string): Promise<Category> {
    return this.findVisible(userId, id);
  }

  private async findVisible(userId: string, id: string): Promise<Category> {
    const category = await this.prisma.category.findFirst({
      where: { id, deletedAt: null, OR: [{ userId: null, isDefault: true }, { userId }] },
    });
    if (!category) throw new NotFoundException('Categoria non trovata');
    return category;
  }

  private async ensureUnique(userId: string, slug: string, excludeId?: string): Promise<void> {
    const duplicate = await this.prisma.category.findFirst({
      where: {
        slug,
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined,
        OR: [{ userId: null, isDefault: true }, { userId }],
      },
    });
    if (duplicate) throw new ConflictException('Esiste già una categoria con questo nome');
  }

  private toResponse(row: CategoryWithPreferences): CategoryResponse {
    const preference = row.preferences[0];
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      color: row.color,
      icon: row.icon,
      sortOrder: preference?.sortOrder ?? row.sortOrder,
      isDefault: row.isDefault,
      isCustom: !row.isDefault,
      isActive: preference?.isActive ?? row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
