import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Request, Response } from 'express';

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
    const cookies = (request.cookies ?? {}) as Record<string, unknown>;
    const token = cookies[this.cookieName];

    return typeof token === 'string' ? token : undefined;
  }

  set(response: Response, token: string, expires: Date): void {
    response.cookie(this.cookieName, token, {
      ...this.options(),
      expires
    });
  }

  clear(response: Response): void {
    response.clearCookie(this.cookieName, this.options());
  }

  private options(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.secure,
      sameSite: this.sameSite,
      path: '/api/v1/auth'
    };
  }
}
