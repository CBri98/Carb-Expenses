import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ExpenseStatus, PaymentMethod } from '@prisma/client';
import { Transform, type TransformFnParams } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;
const commaSeparated = ({ value }: TransformFnParams): unknown => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  return value.split(',').map((item) => item.trim()).filter(Boolean);
};
const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

export class CalendarExpensesQueryDto {
  @ApiProperty({ example: '2026-07-01', description: 'Data iniziale inclusiva' })
  @IsString()
  @Matches(LOCAL_DATE, { message: 'start deve usare il formato YYYY-MM-DD' })
  start!: string;

  @ApiProperty({ example: '2026-08-01', description: 'Data finale esclusiva' })
  @IsString()
  @Matches(LOCAL_DATE, { message: 'end deve usare il formato YYYY-MM-DD' })
  end!: string;

  @ApiPropertyOptional({
    enum: ExpenseStatus,
    isArray: true,
    example: [ExpenseStatus.PLANNED, ExpenseStatus.COMPLETED],
    description: 'Stati separati da virgola; default PLANNED,COMPLETED',
  })
  @Transform(commaSeparated)
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(ExpenseStatus, { each: true })
  status?: ExpenseStatus[];

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'UUID separati da virgola; semantica ANY',
  })
  @Transform(commaSeparated)
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID(undefined, { each: true })
  labelIds?: string[];

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ maxLength: 150, description: 'Ricerca in descrizione ed esercente' })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;
}
