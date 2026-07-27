import {
  AccentColor,
  CalendarViewPreference,
  PaymentMethod,
  ThemeMode,
} from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ALLOWED_ICON_KEYS } from '../settings.defaults';

const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;
const email = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
const PASSWORD = /^(?=.*[A-Za-z])(?=.*\d).+$/;
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const REMINDER_PRESETS = [
  'SAME_DAY',
  'ONE_DAY_BEFORE',
  'THREE_DAYS_BEFORE',
  'SEVEN_DAYS_BEFORE',
] as const;

export class UpdateAccountDto {
  @ApiPropertyOptional({ example: 'Cristian', maxLength: 80 })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Rossi', maxLength: 80, nullable: true })
  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  lastName?: string | null;

  @ApiPropertyOptional({ example: 'utente@example.com' })
  @Transform(email)
  @IsOptional()
  @IsEmail()
  @MaxLength(191)
  email?: string;

  @ApiPropertyOptional({ description: 'Obbligatoria soltanto quando cambia l’email.' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  currentPassword?: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MaxLength(128)
  currentPassword!: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(PASSWORD, { message: 'La password deve contenere almeno una lettera e un numero' })
  newPassword!: string;

  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  confirmPassword!: string;
}

export class UpdateAppearancePreferencesDto {
  @ApiPropertyOptional({ enum: ThemeMode })
  @IsOptional()
  @IsEnum(ThemeMode)
  themeMode?: ThemeMode;

  @ApiPropertyOptional({ enum: AccentColor })
  @IsOptional()
  @IsEnum(AccentColor)
  accentColor?: AccentColor;
}

export class UpdateExperiencePreferencesDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  sidebarCollapsedByDefault?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  compactTables?: boolean;

  @ApiPropertyOptional({ enum: [10, 20, 50, 100] })
  @IsOptional()
  @IsIn([10, 20, 50, 100])
  defaultPageSize?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  rememberExpenseFilters?: boolean;

  @ApiPropertyOptional({ enum: ['COMPLETED', 'PLANNED'] })
  @IsOptional()
  @IsIn(['COMPLETED', 'PLANNED'])
  defaultExpenseStatus?: 'COMPLETED' | 'PLANNED';

  @ApiPropertyOptional({ enum: PaymentMethod, nullable: true })
  @IsOptional()
  @IsEnum(PaymentMethod)
  defaultPaymentMethod?: PaymentMethod | null;

  @ApiPropertyOptional({ enum: CalendarViewPreference })
  @IsOptional()
  @IsEnum(CalendarViewPreference)
  defaultCalendarView?: CalendarViewPreference;

  @ApiPropertyOptional({ enum: [6, 12] })
  @IsOptional()
  @IsIn([6, 12])
  dashboardTrendMonths?: number;
}

export class UpdateIconPreferencesDto {
  @ApiPropertyOptional({ type: [String], minItems: 1, maxItems: 100, uniqueItems: true })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn(ALLOWED_ICON_KEYS, { each: true })
  enabledCategoryIcons?: string[];

  @ApiPropertyOptional({ type: [String], minItems: 1, maxItems: 100, uniqueItems: true })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn(ALLOWED_ICON_KEYS, { each: true })
  enabledLabelIcons?: string[];
}

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @Matches(TIME)
  defaultReminderTime?: string;

  @ApiPropertyOptional({ enum: REMINDER_PRESETS, isArray: true, uniqueItems: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @ArrayUnique()
  @IsIn(REMINDER_PRESETS, { each: true })
  defaultReminderTypes?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  dueTodayEnabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  overdueEnabled?: boolean;
}
