import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';

const CURRENT_COOKIE_PATH = '/api/v1';
const LEGACY_COOKIE_PATHS = ['/api/v1/auth'] as const;

@Injectable()
export class AuthCookieService {
  private readonly cookieName: string;
  private readonly secure: boolean;
  private readonly sameSite: 'lax' | 'strict' | 'none';

  constructor(config: ConfigService) {
    this.cookieName = config.getOrThrow<string>('REFRESH_TOKEN_COOKIE');
    this.secure = config.getOrThrow<boolean>('COOKIE_SECURE');
    this.sameSite = config.getOrThrow<'lax' | 'strict' | 'none'>('COOKIE_SAME_SITE');
  }

  read(request: Request): string | undefined {
    const values = cookieHeaderValues(request.headers.cookie, this.cookieName);
    if (values.length > 0) {
      // RFC 6265 orders longer paths first. During the path migration the
      // current /api/v1 cookie is therefore the last duplicate in the header.
      return values[values.length - 1];
    }

    const cookies = (request.cookies ?? {}) as Record<string, unknown>;
    const token = cookies[this.cookieName];

    return typeof token === 'string' ? token : undefined;
  }

  set(response: Response, token: string, expires: Date): void {
    this.clearLegacy(response);
    response.cookie(this.cookieName, token, {
      ...this.options(),
      expires
    });
  }

  clear(response: Response): void {
    response.clearCookie(this.cookieName, this.options());
    this.clearLegacy(response);
  }

  private options(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSite,
      // The settings session-management endpoint must receive the current
      // refresh token so it can preserve that session while revoking the
      // others. The cookie remains HttpOnly and is never used as API auth.
      path: CURRENT_COOKIE_PATH
    };
  }

  private clearLegacy(response: Response): void {
    for (const path of LEGACY_COOKIE_PATHS) {
      response.clearCookie(this.cookieName, {
        ...this.options(),
        path,
      });
    }
  }
}

function cookieHeaderValues(header: string | undefined, name: string): string[] {
  if (!header) return [];

  const values: string[] = [];
  for (const entry of header.split(';')) {
    const separator = entry.indexOf('=');
    if (separator < 0 || entry.slice(0, separator).trim() !== name) continue;
    const value = entry.slice(separator + 1).trim();
    if (!value) continue;
    try {
      values.push(decodeURIComponent(value));
    } catch {
      values.push(value);
    }
  }
  return values;
}
