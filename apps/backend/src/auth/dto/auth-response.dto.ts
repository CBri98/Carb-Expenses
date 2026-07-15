import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  firstName!: string;

  @ApiPropertyOptional({ nullable: true })
  lastName!: string | null;

  @ApiProperty({ example: 'EUR' })
  currency!: string;

  @ApiProperty({ example: 'Europe/Rome' })
  timezone!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user!: UserResponseDto;

  @ApiProperty({ description: 'JWT access token a breve durata' })
  accessToken!: string;
}
