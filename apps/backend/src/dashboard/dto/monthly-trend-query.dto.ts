import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { DashboardPeriodQueryDto } from './dashboard-period-query.dto';

export class MonthlyTrendQueryDto extends DashboardPeriodQueryDto {
  @ApiPropertyOptional({ default: 6, minimum: 1, maximum: 24 })
  @Transform(({ value }: { value: unknown }) =>
    value === undefined || value === '' ? 6 : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(24)
  @IsOptional()
  months = 6;
}
