import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { NotificationStatus, NotificationType, ReminderType } from '@prisma/client';
import { Transform, Type, type TransformFnParams } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Max,
  Min,
} from 'class-validator';

const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateExpenseReminderDto {
  @ApiProperty({ enum: ReminderType, example: ReminderType.THREE_DAYS_BEFORE })
  @IsEnum(ReminderType)
  type!: ReminderType;

  @ApiPropertyOptional({
    description: 'Obbligatorio esclusivamente per CUSTOM; timestamp ISO 8601 con offset.',
    example: '2026-07-18T09:00:00+02:00',
  })
  @Transform(trim)
  @IsOptional()
  @IsDateString({ strict: true })
  scheduledAt?: string;
}

export class UpdateExpenseReminderDto extends PartialType(CreateExpenseReminderDto) {
  @ApiPropertyOptional({ description: 'Riattiva o disattiva il promemoria.' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class NotificationQueryDto {
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

  @ApiPropertyOptional({ description: 'Ricerca in titolo e messaggio', maxLength: 150 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @ApiPropertyOptional({ enum: NotificationStatus })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiPropertyOptional({ enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  expenseId?: string;

  @ApiPropertyOptional({ example: '2026-07-01' })
  @IsOptional()
  @IsDateString({ strict: true })
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-07-31' })
  @IsOptional()
  @IsDateString({ strict: true })
  dateTo?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum({ asc: 'asc', desc: 'desc' })
  sortDirection: 'asc' | 'desc' = 'desc';
}

export class NotificationStatusDto {
  @ApiProperty({ enum: NotificationStatus })
  @IsEnum(NotificationStatus)
  status!: NotificationStatus;
}
