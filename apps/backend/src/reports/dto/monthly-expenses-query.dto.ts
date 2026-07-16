import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDefined, IsInt, Max, Min } from 'class-validator';

import { ExpenseQueryDto } from '../../expenses/dto/expense.dto';

export class MonthlyExpensesQueryDto extends ExpenseQueryDto {
  @ApiProperty({ minimum: 1, maximum: 12, example: 7 })
  @Type(() => Number)
  @IsDefined()
  @IsInt()
  @Min(1)
  @Max(12)
  override month = 0;

  @ApiProperty({ minimum: 2000, maximum: 2100, example: 2026 })
  @Type(() => Number)
  @IsDefined()
  @IsInt()
  @Min(2000)
  @Max(2100)
  override year = 0;
}
