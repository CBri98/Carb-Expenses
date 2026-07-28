import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseStatus, ReminderSource, ReminderType } from '@prisma/client';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

export enum ReminderDerivedStatus {
  ACTIVE = 'ACTIVE',
  UPCOMING = 'UPCOMING',
  DUE = 'DUE',
  PROCESSED = 'PROCESSED',
  CANCELLED = 'CANCELLED',
  INVALID = 'INVALID',
}

export enum ReminderSortField {
  SCHEDULED_AT = 'scheduledAt',
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  EXPENSE_DATE = 'expenseDate',
  EXPENSE_DESCRIPTION = 'expenseDescription',
  STATUS = 'status',
}

export class ReminderQueryDto {
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

  @ApiPropertyOptional({ enum: ReminderDerivedStatus })
  @IsOptional()
  @IsEnum(ReminderDerivedStatus)
  status?: ReminderDerivedStatus;

  @ApiPropertyOptional({ enum: ReminderType })
  @IsOptional()
  @IsEnum(ReminderType)
  type?: ReminderType;

  @ApiPropertyOptional({ enum: ReminderSource })
  @IsOptional()
  @IsEnum(ReminderSource)
  source?: ReminderSource;

  @ApiPropertyOptional({ enum: ExpenseStatus })
  @IsOptional()
  @IsEnum(ExpenseStatus)
  expenseStatus?: ExpenseStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  recurrenceRuleId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString({ strict: true })
  scheduledFrom?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString({ strict: true })
  scheduledTo?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString({ strict: true })
  expenseDateFrom?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @IsDateString({ strict: true })
  expenseDateTo?: string;

  @ApiPropertyOptional({ enum: ReminderSortField, default: ReminderSortField.SCHEDULED_AT })
  @IsOptional()
  @IsEnum(ReminderSortField)
  sortBy: ReminderSortField = ReminderSortField.SCHEDULED_AT;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsEnum({ asc: 'asc', desc: 'desc' })
  sortDirection: 'asc' | 'desc' = 'asc';
}

export class ReminderSummaryQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 30, default: 7 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  upcomingDays = 7;
}

export class UpdateGlobalReminderDto {
  @ApiPropertyOptional({ enum: ReminderType })
  @IsOptional()
  @IsEnum(ReminderType)
  type?: ReminderType;

  @ApiPropertyOptional({ format: 'date-time' })
  @Transform(trim)
  @IsOptional()
  @IsDateString({ strict: true })
  scheduledAt?: string;
}

export class ReminderBulkActionDto {
  @ApiProperty({ type: [String], maxItems: 100, minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  ids!: string[];
}
