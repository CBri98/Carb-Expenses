import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDefined, IsInt, IsOptional, Max, Min, ValidateIf } from 'class-validator';

const optionalInteger = ({ value }: { value: unknown }): unknown =>
  value === undefined || value === '' ? undefined : Number(value);

export class DashboardPeriodQueryDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 12, example: 7 })
  @Transform(optionalInteger)
  @ValidateIf((query: DashboardPeriodQueryDto) => query.year !== undefined)
  @IsDefined({ message: 'Il mese è obbligatorio quando viene specificato l’anno' })
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  month?: number;

  @ApiPropertyOptional({ minimum: 2000, maximum: 2100, example: 2026 })
  @Transform(optionalInteger)
  @ValidateIf((query: DashboardPeriodQueryDto) => query.month !== undefined)
  @IsDefined({ message: 'L’anno è obbligatorio quando viene specificato il mese' })
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  year?: number;
}
