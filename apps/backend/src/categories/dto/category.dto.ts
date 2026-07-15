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

export class CreateCategoryDto {
  @ApiProperty({ example: 'Casa nuova', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ maxLength: 255, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @ApiProperty({ example: '#2563EB', pattern: COLOR.source })
  @IsString()
  @Matches(COLOR, { message: 'Il colore deve usare il formato #RRGGBB' })
  color!: string;

  @ApiProperty({ example: 'bi-house-door' })
  @IsString()
  @Matches(ICON, { message: "L'icona deve iniziare con bi-" })
  icon!: string;

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

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class UpdateCategoryStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive!: boolean;
}

export class ReorderItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  sortOrder!: number;
}

export class ReorderCategoriesDto {
  @ApiProperty({ type: [ReorderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items!: ReorderItemDto[];
}

export class CategoryQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional()
  @Transform(optionalBoolean)
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ enum: ['all', 'default', 'custom'], default: 'all' })
  @IsOptional()
  @IsIn(['all', 'default', 'custom'])
  type: 'all' | 'default' | 'custom' = 'all';

  @ApiPropertyOptional({ enum: ['name', 'sortOrder', 'createdAt'] })
  @IsOptional()
  @IsIn(['name', 'sortOrder', 'createdAt'])
  sortBy: 'name' | 'sortOrder' | 'createdAt' = 'sortOrder';

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection: 'asc' | 'desc' = 'asc';
}
