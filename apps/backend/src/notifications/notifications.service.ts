import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationStatus, Prisma } from '@prisma/client';

import type { ApiPayload } from '../common/interceptors/api-response.interceptor';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationQueryDto } from './dto/notification.dto';
import { NotificationsMapper } from './notifications.mapper';
import {
  notificationInclude,
  type NotificationPaginationMeta,
  type NotificationResponse,
  type NotificationWithRelations,
} from './notifications.types';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<ApiPayload<NotificationResponse[]>> {
    const where = this.where(userId, query);
    const [totalItems, notifications] = await this.prisma.$transaction([
      this.prisma.notification.count({ where }),
      this.prisma.notification.findMany({
        where,
        include: notificationInclude,
        orderBy: [{ createdAt: query.sortDirection }, { id: query.sortDirection }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);
    const meta: NotificationPaginationMeta = {
      page: query.page,
      pageSize: query.pageSize,
      totalItems,
      totalPages: totalItems === 0 ? 0 : Math.ceil(totalItems / query.pageSize),
    };
    return {
      data: notifications.map((notification) =>
        NotificationsMapper.notification(notification),
      ),
      meta,
    };
  }

  async unreadCount(userId: string): Promise<{ count: number }> {
    return {
      count: await this.prisma.notification.count({
        where: { userId, status: NotificationStatus.UNREAD },
      }),
    };
  }

  async findOne(userId: string, id: string): Promise<NotificationResponse> {
    return NotificationsMapper.notification(await this.findOwned(userId, id));
  }

  async markRead(userId: string, id: string): Promise<NotificationResponse> {
    const notification = await this.findOwned(userId, id);
    if (notification.status === NotificationStatus.ARCHIVED) {
      throw new BadRequestException('Una notifica archiviata non può essere modificata');
    }
    if (notification.status === NotificationStatus.READ) {
      return NotificationsMapper.notification(notification);
    }
    return NotificationsMapper.notification(
      await this.prisma.notification.update({
        where: { id },
        data: { status: NotificationStatus.READ, readAt: new Date() },
        include: notificationInclude,
      }),
    );
  }

  async markUnread(userId: string, id: string): Promise<NotificationResponse> {
    const notification = await this.findOwned(userId, id);
    if (notification.status === NotificationStatus.ARCHIVED) {
      throw new BadRequestException('Una notifica archiviata non può essere modificata');
    }
    if (notification.status === NotificationStatus.UNREAD) {
      return NotificationsMapper.notification(notification);
    }
    return NotificationsMapper.notification(
      await this.prisma.notification.update({
        where: { id },
        data: { status: NotificationStatus.UNREAD, readAt: null },
        include: notificationInclude,
      }),
    );
  }

  async markAllRead(userId: string): Promise<{ updatedCount: number }> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, status: NotificationStatus.UNREAD },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
    return { updatedCount: result.count };
  }

  async archive(userId: string, id: string): Promise<NotificationResponse> {
    const notification = await this.findOwned(userId, id);
    if (notification.status === NotificationStatus.ARCHIVED) {
      return NotificationsMapper.notification(notification);
    }
    return NotificationsMapper.notification(
      await this.prisma.notification.update({
        where: { id },
        data: { status: NotificationStatus.ARCHIVED, archivedAt: new Date() },
        include: notificationInclude,
      }),
    );
  }

  async unarchive(userId: string, id: string): Promise<NotificationResponse> {
    const notification = await this.findOwned(userId, id);
    if (notification.status !== NotificationStatus.ARCHIVED) {
      return NotificationsMapper.notification(notification);
    }
    return NotificationsMapper.notification(
      await this.prisma.notification.update({
        where: { id },
        data: {
          status: NotificationStatus.READ,
          readAt: notification.readAt ?? new Date(),
          archivedAt: null,
        },
        include: notificationInclude,
      }),
    );
  }

  private async findOwned(userId: string, id: string): Promise<NotificationWithRelations> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
      include: notificationInclude,
    });
    if (!notification) throw new NotFoundException('Notifica non trovata');
    return notification;
  }

  private where(userId: string, query: NotificationQueryDto): Prisma.NotificationWhereInput {
    const createdAt: Prisma.DateTimeFilter = {};
    if (query.dateFrom) createdAt.gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const to = new Date(query.dateTo);
      if (/^\d{4}-\d{2}-\d{2}$/.test(query.dateTo)) {
        to.setUTCDate(to.getUTCDate() + 1);
        createdAt.lt = to;
      } else {
        createdAt.lte = to;
      }
    }
    if (createdAt.gte && (createdAt.lt ?? createdAt.lte) && createdAt.gte > (createdAt.lt ?? createdAt.lte)!) {
      throw new BadRequestException('La data iniziale non può superare la data finale');
    }
    return {
      userId,
      OR: query.search ? [
        { title: { contains: query.search } },
        { message: { contains: query.search } },
      ] : undefined,
      status: query.status ?? { not: NotificationStatus.ARCHIVED },
      type: query.type,
      expenseId: query.expenseId,
      createdAt: Object.keys(createdAt).length ? createdAt : undefined,
    };
  }
}
