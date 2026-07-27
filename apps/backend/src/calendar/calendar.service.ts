import { BadRequestException, Injectable } from '@nestjs/common';
import { ExpenseStatus, Prisma } from '@prisma/client';

import {
  dateOnly,
  daysBetween,
  isoDate,
  romeCalendarDate,
} from '../dashboard/dashboard.utils';
import { parseExpenseDate } from '../expenses/expense.utils';
import { PrismaService } from '../prisma/prisma.service';
import { CalendarMapper } from './calendar.mapper';
import type { CalendarExpenseEvent } from './calendar.types';
import type { CalendarExpensesQueryDto } from './dto/calendar-expenses-query.dto';

const expenseInclude = {
  category: true,
  labels: { include: { label: true } },
  recurrenceRule: { select: { id: true, name: true, status: true } },
} satisfies Prisma.ExpenseInclude;

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async expenses(
    userId: string,
    query: CalendarExpensesQueryDto,
    now = new Date(),
  ): Promise<CalendarExpenseEvent[]> {
    const start = parseExpenseDate(query.start, 'start');
    const end = parseExpenseDate(query.end, 'end');
    if (end <= start) {
      throw new BadRequestException('La data end deve essere successiva a start');
    }
    if (daysBetween(start, end) > 366) {
      throw new BadRequestException("L'intervallo del calendario non può superare 366 giorni");
    }

    const statuses = query.status?.length
      ? query.status
      : [ExpenseStatus.PLANNED, ExpenseStatus.COMPLETED];
    const events = await this.prisma.expense.findMany({
      where: {
        userId,
        deletedAt: null,
        expenseDate: { gte: start, lt: end },
        status: { in: statuses },
        categoryId: query.categoryId,
        paymentMethod: query.paymentMethod,
        labels: query.labelIds?.length
          ? { some: { labelId: { in: query.labelIds } } }
          : undefined,
        OR: query.search
          ? [
              { description: { contains: query.search } },
              { merchant: { contains: query.search } },
            ]
          : undefined,
      },
      include: expenseInclude,
      orderBy: [
        { expenseDate: 'asc' },
        { expenseTime: 'asc' },
        { createdAt: 'asc' },
        { id: 'asc' },
      ],
    });

    const current = romeCalendarDate(now);
    const today = isoDate(dateOnly(current.year, current.month, current.day));
    return events.map((expense) => CalendarMapper.toEvent(expense, today));
  }
}
