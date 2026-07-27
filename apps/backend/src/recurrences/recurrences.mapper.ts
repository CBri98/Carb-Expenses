import { formatExpenseDate, formatExpenseTime } from '../expenses/expense.utils';
import type { RecurrenceResponse, RecurrenceWithRelations } from './recurrences.types';

export class RecurrencesMapper {
  static toResponse(
    rule: RecurrenceWithRelations,
    previewDates?: readonly Date[],
  ): RecurrenceResponse {
    return {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      amount: rule.amount.toFixed(2),
      merchant: rule.merchant,
      paymentMethod: rule.paymentMethod,
      notes: rule.notes,
      frequency: rule.frequency,
      interval: rule.interval,
      status: rule.status,
      startDate: formatExpenseDate(rule.startDate),
      endDate: rule.endDate ? formatExpenseDate(rule.endDate) : null,
      nextOccurrenceDate: rule.nextOccurrenceDate
        ? formatExpenseDate(rule.nextOccurrenceDate)
        : null,
      lastGeneratedDate: rule.lastGeneratedDate
        ? formatExpenseDate(rule.lastGeneratedDate)
        : null,
      maxOccurrences: rule.maxOccurrences,
      generatedCount: rule.generatedCount,
      expenseTime: formatExpenseTime(rule.expenseTime),
      generateDaysAhead: rule.generateDaysAhead,
      pausedAt: rule.pausedAt?.toISOString() ?? null,
      completedAt: rule.completedAt?.toISOString() ?? null,
      cancelledAt: rule.cancelledAt?.toISOString() ?? null,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString(),
      category: {
        id: rule.category.id,
        name: rule.category.name,
        color: rule.category.color,
        icon: rule.category.icon,
        isActive: rule.category.isActive,
      },
      labels: rule.labels.map(({ label }) => ({
        id: label.id,
        name: label.name,
        color: label.color,
        icon: label.icon,
        isActive: label.isActive,
      })),
      reminderTemplates: rule.reminderTemplates.map((template) => ({
        id: template.id,
        type: template.type,
        offsetMinutes: template.offsetMinutes,
        reminderTime: formatExpenseTime(template.reminderTime),
      })),
      exceptions: rule.exceptions.map((exception) => ({
        id: exception.id,
        occurrenceDate: formatExpenseDate(exception.occurrenceDate),
        reason: exception.reason,
        createdAt: exception.createdAt.toISOString(),
      })),
      expenseCount: rule._count.expenses,
      previewDates: previewDates?.map((date) => formatExpenseDate(date)),
    };
  }
}
