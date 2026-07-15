import { ApiProperty } from '@nestjs/swagger';
import { Transform, type TransformFnParams } from 'class-transformer';
import { IsEmail, IsString, MaxLength } from 'class-validator';

const normalizeEmail = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class LoginDto {
  @ApiProperty({ example: 'mario.rossi@example.com' })
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Inserisci un indirizzo email valido' })
  @MaxLength(191, { message: 'L’email è troppo lunga' })
  email!: string;

  @ApiProperty({ example: 'Password1' })
  @IsString({ message: 'La password è obbligatoria' })
  @MaxLength(128, { message: 'La password non può superare 128 caratteri' })
  password!: string;
}
