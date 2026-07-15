import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export function parseExpenseDate(value: string, field = 'expenseDate'): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new BadRequestException(`Il campo ${field} non contiene una data valida`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new BadRequestException(`Il campo ${field} non contiene una data valida`);
  }
  return date;
}

export function formatExpenseDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function parseExpenseTime(value?: string | null): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const normalized = value.length === 5 ? `${value}:00` : value;
  return new Date(`1970-01-01T${normalized}.000Z`);
}

export function formatExpenseTime(value: Date | null): string | null {
  return value ? value.toISOString().slice(11, 16) : null;
}

export function parseMoney(value: string): Prisma.Decimal {
  try {
    return new Prisma.Decimal(value.replace(',', '.'));
  } catch {
    throw new BadRequestException("L'importo non è valido");
  }
}

export function optionalPlainText(value?: string | null): string | null | undefined {
  if (value === undefined) return undefined;
  const normalized = value?.trim() ?? '';
  return normalized || null;
}
