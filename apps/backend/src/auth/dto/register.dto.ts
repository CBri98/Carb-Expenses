import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength
} from 'class-validator';

const trimString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

const normalizeEmail = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class RegisterDto {
  @ApiProperty({ example: 'mario.rossi@example.com' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Inserisci un indirizzo email valido' })
  @MaxLength(191, { message: 'L’email è troppo lunga' })
  email!: string;

  @ApiProperty({ minLength: 8, example: 'Password1' })
  @IsString({ message: 'La password è obbligatoria' })
  @MinLength(8, { message: 'La password deve contenere almeno 8 caratteri' })
  @MaxLength(128, { message: 'La password non può superare 128 caratteri' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'La password deve contenere almeno una lettera e un numero'
  })
  password!: string;

  @ApiProperty({ example: 'Mario' })
  @Transform(trimString)
  @IsString({ message: 'Il nome è obbligatorio' })
  @MinLength(1, { message: 'Il nome è obbligatorio' })
  @MaxLength(80, { message: 'Il nome non può superare 80 caratteri' })
  firstName!: string;

  @ApiPropertyOptional({ example: 'Rossi' })
  @Transform(trimString)
  @IsOptional()
  @IsString({ message: 'Il cognome deve essere una stringa' })
  @MaxLength(80, { message: 'Il cognome non può superare 80 caratteri' })
  lastName?: string;
}
