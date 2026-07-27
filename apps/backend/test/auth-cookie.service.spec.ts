import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { AuthCookieService } from '../src/auth/auth-cookie.service';

function createService(): AuthCookieService {
  const values: Record<string, string | boolean> = {
    REFRESH_TOKEN_COOKIE: 'refresh_token',
    COOKIE_SECURE: false,
    COOKIE_SAME_SITE: 'lax',
  };
  const config = {
    getOrThrow: (key: string): string | boolean => values[key] as string | boolean,
  };
  return new AuthCookieService(config as unknown as ConfigService);
}

describe('AuthCookieService', () => {
  it('preferisce il cookie corrente quando il browser invia anche il path legacy', () => {
    const request = {
      headers: {
        cookie: 'refresh_token=legacy-token; other=value; refresh_token=current-token',
      },
      cookies: { refresh_token: 'legacy-token' },
    } as unknown as Request;

    expect(createService().read(request)).toBe('current-token');
  });

  it('mantiene il fallback ai cookie già analizzati quando manca l’header raw', () => {
    const request = {
      headers: {},
      cookies: { refresh_token: 'parsed-token' },
    } as unknown as Request;

    expect(createService().read(request)).toBe('parsed-token');
  });

  it('rimuove il vecchio path prima di impostare il cookie corrente', () => {
    const response = {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as Response;
    const expires = new Date('2026-08-18T00:00:00.000Z');

    createService().set(response, 'new-token', expires);

    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ path: '/api/v1/auth' }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'new-token',
      expect.objectContaining({ path: '/api/v1', expires }),
    );
    expect(vi.mocked(response.clearCookie).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(response.cookie).mock.invocationCallOrder[0] as number,
    );
  });

  it('elimina cookie corrente e legacy durante il logout', () => {
    const response = {
      clearCookie: vi.fn(),
    } as unknown as Response;

    createService().clear(response);

    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ path: '/api/v1' }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      'refresh_token',
      expect.objectContaining({ path: '/api/v1/auth' }),
    );
  });
});
