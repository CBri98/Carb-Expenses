import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class DashboardListQueryDto {
  @ApiPropertyOptional({ default: 5, minimum: 1, maximum: 20 })
  @Transform(({ value }: { value: unknown }) =>
    value === undefined || value === '' ? 5 : Number(value),
  )
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  limit = 5;
}
