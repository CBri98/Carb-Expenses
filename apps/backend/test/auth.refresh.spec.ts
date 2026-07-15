import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it } from 'vitest';

import { createAuthFixture } from './auth.fixture';

describe('AuthService: refresh e logout', () => {
  let fixture: ReturnType<typeof createAuthFixture>;

  beforeEach(() => {
    fixture = createAuthFixture();
  });

  it('ruota il refresh token e impedisce il riutilizzo del precedente', async () => {
    const original = await fixture.service.register({
      email: 'rotate@example.com',
      password: 'Password1',
      firstName: 'Rotate'
    });
    const rotated = await fixture.service.refresh(original.refreshToken);

    expect(rotated.refreshToken).not.toBe(original.refreshToken);
    expect([...fixture.tokens.values()].filter((token) => !token.revokedAt)).toHaveLength(1);
    await expect(
      fixture.service.refresh(original.refreshToken)
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rifiuta un refresh token mancante', async () => {
    await expect(fixture.service.refresh(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });

  it('revoca il refresh token al logout', async () => {
    const session = await fixture.service.register({
      email: 'logout@example.com',
      password: 'Password1',
      firstName: 'Logout'
    });

    await fixture.service.logout(session.refreshToken);
    await expect(
      fixture.service.refresh(session.refreshToken)
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
