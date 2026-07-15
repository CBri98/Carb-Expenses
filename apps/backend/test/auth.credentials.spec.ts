import { ConflictException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { beforeEach, describe, expect, it } from 'vitest';

import { RegisterDto } from '../src/auth/dto/register.dto';
import { createAuthFixture } from './auth.fixture';

describe('AuthService: credenziali', () => {
  let fixture: ReturnType<typeof createAuthFixture>;

  beforeEach(() => {
    fixture = createAuthFixture();
  });

  it('registra con email normalizzata, Argon2 e hash del refresh token', async () => {
    const session = await fixture.service.register({
      email: 'Mario.Rossi@example.com',
      password: 'Password1',
      firstName: 'Mario',
      lastName: 'Rossi'
    });
    const user = fixture.users.get('mario.rossi@example.com');
    const storedToken = [...fixture.tokens.values()][0];

    expect(session.user.email).toBe('mario.rossi@example.com');
    expect(user?.passwordHash.startsWith('$argon2id$')).toBe(true);
    expect(storedToken?.tokenHash.startsWith('$argon2id$')).toBe(true);
    expect(storedToken?.tokenHash).not.toBe(session.refreshToken);
  });

  it('rifiuta una registrazione con email duplicata', async () => {
    const request = {
      email: 'utente@example.com',
      password: 'Password1',
      firstName: 'Utente'
    };
    await fixture.service.register(request);
    await expect(fixture.service.register(request)).rejects.toBeInstanceOf(
      ConflictException
    );
  });

  it('esegue il login e restituisce un errore neutro con password errata', async () => {
    await fixture.service.register({
      email: 'utente@example.com',
      password: 'Password1',
      firstName: 'Utente'
    });
    const session = await fixture.service.login({
      email: 'UTENTE@example.com',
      password: 'Password1'
    });

    expect(session.accessToken).toBeTruthy();
    await expect(
      fixture.service.login({ email: 'utente@example.com', password: 'sbagliata' })
    ).rejects.toMatchObject({ message: 'Email o password non corretti' });
  });
});

describe('RegisterDto', () => {
  it('rifiuta una password priva di numeri', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'utente@example.com',
      password: 'solotesto',
      firstName: 'Utente'
    });
    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'password')).toBe(true);
  });
});
