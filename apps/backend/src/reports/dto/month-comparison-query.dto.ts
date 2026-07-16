import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class MonthComparisonQueryDto {
  @ApiProperty({ minimum: 1, maximum: 12, example: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  monthA!: number;

  @ApiProperty({ minimum: 2000, maximum: 2100, example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  yearA!: number;

  @ApiProperty({ minimum: 1, maximum: 12, example: 7 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  monthB!: number;

  @ApiProperty({ minimum: 2000, maximum: 2100, example: 2026 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  yearB!: number;
}

export class DailyComparisonQueryDto extends MonthComparisonQueryDto {
  @ApiPropertyOptional({
    enum: ['CALENDAR_DAY'],
    default: 'CALENDAR_DAY',
    description: 'Confronto per giorno di calendario; i giorni inesistenti valgono null',
  })
  @IsOptional()
  @IsIn(['CALENDAR_DAY'])
  mode = 'CALENDAR_DAY' as const;
}
