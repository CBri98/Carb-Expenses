import { OmitType, PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseStatus, PaymentMethod } from '@prisma/client';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const MONEY = /^(?!0+(?:\.0{1,2})?$)(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;
const FILTER_MONEY = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;
const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_TIME = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

const trimMultiline = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

const decimalPoint = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().replace(',', '.') : value;

const commaSeparatedIds = ({ value }: TransformFnParams): unknown => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  return value.split(',').map((item) => item.trim()).filter(Boolean);
};

export class CreateExpenseDto {
  @ApiProperty({ example: 'Spesa supermercato', maxLength: 150 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  description!: string;

  @ApiProperty({ example: '86.45', type: String })
  @Transform(decimalPoint)
  @IsString()
  @Matches(MONEY, { message: "L'importo deve essere positivo e avere massimo due decimali" })
  amount!: string;

  @ApiProperty({ example: '2026-07-14', pattern: LOCAL_DATE.source })
  @IsString()
  @Matches(LOCAL_DATE, { message: 'La data deve usare il formato YYYY-MM-DD' })
  expenseDate!: string;

  @ApiPropertyOptional({ example: '18:30', pattern: LOCAL_TIME.source, nullable: true })
  @IsOptional()
  @IsString()
  @Matches(LOCAL_TIME, { message: "L'ora deve usare il formato HH:mm o HH:mm:ss" })
  expenseTime?: string | null;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({ type: [String], format: 'uuid', uniqueItems: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  labelIds?: string[];

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.DEBIT_CARD })
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({ maxLength: 150, nullable: true })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  merchant?: string | null;

  @ApiPropertyOptional({ maxLength: 5000, nullable: true })
  @Transform(trimMultiline)
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;

  @ApiProperty({ enum: ExpenseStatus, example: ExpenseStatus.COMPLETED })
  @IsEnum(ExpenseStatus)
  status!: ExpenseStatus;
}

export class UpdateExpenseDto extends PartialType(CreateExpenseDto) {}

export class UpdateExpenseStatusDto {
  @ApiProperty({ enum: ExpenseStatus })
  @IsEnum(ExpenseStatus)
  status!: ExpenseStatus;
}

export class DuplicateExpenseDto {
  @ApiPropertyOptional({ example: '2026-07-20', pattern: LOCAL_DATE.source })
  @IsOptional()
  @IsString()
  @Matches(LOCAL_DATE, { message: 'La data deve usare il formato YYYY-MM-DD' })
  expenseDate?: string;
}

export class ExpenseQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @ApiPropertyOptional({ maxLength: 150 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @Matches(LOCAL_DATE)
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @Matches(LOCAL_DATE)
  dateTo?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({ minimum: 2000, maximum: 2200 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2200)
  year?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'UUID separati da virgola; semantica ANY', type: String })
  @Transform(commaSeparatedIds)
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  labelIds?: string[];

  @ApiPropertyOptional({ enum: ExpenseStatus })
  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: '10.00', type: String })
  @Transform(decimalPoint)
  @IsOptional()
  @Matches(FILTER_MONEY)
  minAmount?: string;

  @ApiPropertyOptional({ example: '500.00', type: String })
  @Transform(decimalPoint)
  @IsOptional()
  @Matches(FILTER_MONEY)
  maxAmount?: string;

  @ApiPropertyOptional({
    enum: ['expenseDate', 'amount', 'description', 'createdAt', 'updatedAt'],
    default: 'expenseDate',
  })
  @IsOptional()
  @IsIn(['expenseDate', 'amount', 'description', 'createdAt', 'updatedAt'])
  sortBy: 'expenseDate' | 'amount' | 'description' | 'createdAt' | 'updatedAt' = 'expenseDate';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection: 'asc' | 'desc' = 'desc';
}

export class ExpenseExportQueryDto extends OmitType(ExpenseQueryDto, [
  'page',
  'pageSize',
] as const) {}
