import { PartialType } from '@nestjs/swagger';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ExpenseStatus,
  PaymentMethod,
  RecurrenceFrequency,
  RecurrenceStatus,
  ReminderType,
} from '@prisma/client';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
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
  ValidateNested,
} from 'class-validator';

const MONEY = /^(?!0+(?:\.0{1,2})?$)(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;
const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;
const trimMultiline = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;
const decimalPoint = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().replace(',', '.') : value;

export enum RecurrenceUpdateScope {
  RULE_ONLY = 'RULE_ONLY',
  RULE_AND_FUTURE_PLANNED_EXPENSES = 'RULE_AND_FUTURE_PLANNED_EXPENSES',
}

export class RecurrenceReminderTemplateDto {
  @ApiProperty({
    enum: [
      ReminderType.SAME_DAY,
      ReminderType.ONE_DAY_BEFORE,
      ReminderType.THREE_DAYS_BEFORE,
      ReminderType.SEVEN_DAYS_BEFORE,
    ],
  })
  @IsEnum(ReminderType)
  type!: ReminderType;

  @ApiPropertyOptional({
    example: '09:00',
    description: 'Ora locale del promemoria; se assente usa l’ora della spesa o il default',
  })
  @IsOptional()
  @Matches(LOCAL_TIME)
  reminderTime?: string | null;
}

export class CreateRecurrenceDto {
  @ApiProperty({ example: 'Affitto appartamento', maxLength: 150 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @ApiProperty({ example: 'Affitto mensile', maxLength: 150 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  description!: string;

  @ApiProperty({ example: '800.00', type: String })
  @Transform(decimalPoint)
  @IsString()
  @Matches(MONEY, { message: "L'importo deve essere positivo e avere massimo due decimali" })
  amount!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId!: string;

  @ApiPropertyOptional({ type: [String], format: 'uuid', uniqueItems: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  labelIds?: string[];

  @ApiPropertyOptional({ maxLength: 150, nullable: true })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  merchant?: string | null;

  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.OTHER })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod = PaymentMethod.OTHER;

  @ApiPropertyOptional({ maxLength: 5000, nullable: true })
  @Transform(trimMultiline)
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string | null;

  @ApiProperty({ enum: RecurrenceFrequency })
  @IsEnum(RecurrenceFrequency)
  frequency!: RecurrenceFrequency;

  @ApiProperty({ minimum: 1, maximum: 365, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  interval = 1;

  @ApiProperty({ example: '2026-08-01' })
  @Matches(LOCAL_DATE)
  startDate!: string;

  @ApiPropertyOptional({ example: '2027-08-01', nullable: true })
  @IsOptional()
  @Matches(LOCAL_DATE)
  endDate?: string | null;

  @ApiPropertyOptional({ minimum: 1, maximum: 10000, nullable: true })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10_000)
  maxOccurrences?: number | null;

  @ApiPropertyOptional({ example: '09:00', nullable: true })
  @IsOptional()
  @Matches(LOCAL_TIME)
  expenseTime?: string | null;

  @ApiPropertyOptional({ minimum: 1, maximum: 365, default: 30 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  generateDaysAhead?: number;

  @ApiPropertyOptional({ type: [RecurrenceReminderTemplateDto], uniqueItems: true })
  @IsOptional()
  @IsArray()
  @ArrayUnique((template: RecurrenceReminderTemplateDto) => template.type)
  @ValidateNested({ each: true })
  @Type(() => RecurrenceReminderTemplateDto)
  reminderTemplates?: RecurrenceReminderTemplateDto[];
}

export class UpdateRecurrenceDto extends PartialType(CreateRecurrenceDto) {
  @ApiPropertyOptional({ enum: RecurrenceUpdateScope, default: RecurrenceUpdateScope.RULE_ONLY })
  @IsOptional()
  @IsEnum(RecurrenceUpdateScope)
  updateScope: RecurrenceUpdateScope = RecurrenceUpdateScope.RULE_ONLY;
}

export class RecurrenceQueryDto {
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

  @ApiPropertyOptional({ enum: RecurrenceStatus })
  @IsOptional()
  @IsEnum(RecurrenceStatus)
  status?: RecurrenceStatus;

  @ApiPropertyOptional({ enum: RecurrenceFrequency })
  @IsOptional()
  @IsEnum(RecurrenceFrequency)
  frequency?: RecurrenceFrequency;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({
    enum: ['nextOccurrenceDate', 'name', 'amount', 'createdAt', 'updatedAt'],
    default: 'nextOccurrenceDate',
  })
  @IsOptional()
  @IsIn(['nextOccurrenceDate', 'name', 'amount', 'createdAt', 'updatedAt'])
  sortBy: 'nextOccurrenceDate' | 'name' | 'amount' | 'createdAt' | 'updatedAt' =
    'nextOccurrenceDate';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection: 'asc' | 'desc' = 'asc';
}

export class RecurrencePreviewDto {
  @ApiProperty({ enum: RecurrenceFrequency })
  @IsEnum(RecurrenceFrequency)
  frequency!: RecurrenceFrequency;

  @ApiProperty({ minimum: 1, maximum: 365 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  interval!: number;

  @ApiProperty({ example: '2026-08-01' })
  @Matches(LOCAL_DATE)
  startDate!: string;

  @ApiPropertyOptional({ example: '2027-08-01', nullable: true })
  @IsOptional()
  @Matches(LOCAL_DATE)
  endDate?: string | null;

  @ApiPropertyOptional({ minimum: 1, maximum: 10000, nullable: true })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10_000)
  maxOccurrences?: number | null;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;
}

export class SavedRecurrencePreviewQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 10 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 10;
}

export class RecurrenceExpensesQueryDto {
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

  @ApiPropertyOptional({ enum: ExpenseStatus })
  @IsOptional()
  @IsEnum(ExpenseStatus)
  status?: ExpenseStatus;

  @ApiPropertyOptional({ example: '2026-08-01' })
  @IsOptional()
  @Matches(LOCAL_DATE)
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @Matches(LOCAL_DATE)
  dateTo?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection: 'asc' | 'desc' = 'asc';
}

export class PauseRecurrenceDto {
  @ApiPropertyOptional({
    default: false,
    description: 'Se true annulla soltanto le spese future pianificate già generate',
  })
  @IsOptional()
  @IsBoolean()
  cancelFutureExpenses = false;
}

export class CancelRecurrenceDto {
  @ApiProperty({
    description: 'Se true annulla soltanto le spese future pianificate già generate',
  })
  @IsBoolean()
  cancelFutureExpenses!: boolean;
}

export class CreateRecurrenceExceptionDto {
  @ApiProperty({ example: '2026-12-01' })
  @Matches(LOCAL_DATE)
  occurrenceDate!: string;

  @ApiPropertyOptional({ maxLength: 255, nullable: true })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string | null;
}
