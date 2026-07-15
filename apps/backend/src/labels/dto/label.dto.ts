import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { optionalBoolean } from '../../common/utils/query.transforms';

const COLOR = /^#[0-9A-Fa-f]{6}$/;
const ICON = /^bi-[a-z0-9-]+$/;

export class CreateLabelDto {
  @ApiProperty({ example: 'Pranzo di lavoro', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ maxLength: 255, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @ApiProperty({ example: '#F59E0B' })
  @IsString()
  @Matches(COLOR, { message: 'Il colore deve usare il formato #RRGGBB' })
  color!: string;

  @ApiPropertyOptional({ example: 'bi-briefcase', nullable: true })
  @IsOptional()
  @IsString()
  @Matches(ICON, { message: "L'icona deve iniziare con bi-" })
  icon?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  categoryId?: string | null;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateLabelDto extends PartialType(CreateLabelDto) {}

export class UpdateLabelStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive!: boolean;
}

export class ReorderLabelItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class ReorderLabelsDto {
  @ApiProperty({ type: [ReorderLabelItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderLabelItemDto)
  items!: ReorderLabelItemDto[];
}

export class LabelQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(optionalBoolean)
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ enum: ['name', 'sortOrder', 'createdAt'] })
  @IsOptional()
  @IsIn(['name', 'sortOrder', 'createdAt'])
  sortBy: 'name' | 'sortOrder' | 'createdAt' = 'sortOrder';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection: 'asc' | 'desc' = 'asc';
}
