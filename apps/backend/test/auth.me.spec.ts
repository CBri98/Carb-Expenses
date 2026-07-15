import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AuthCookieService } from '../src/auth/auth-cookie.service';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { UsersService } from '../src/users/users.service';

const accessSecret = 'test_access_secret_that_is_long_enough_2026';
const user = {
  id: 'user-me',
  email: 'me@example.com',
  passwordHash: '$argon2id$unused',
  firstName: 'Mario',
  lastName: 'Rossi',
  currency: 'EUR',
  timezone: 'Europe/Rome',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z')
};

describe('GET /api/v1/auth/me', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [PassportModule, JwtModule.register({})],
      controllers: [AuthController],
      providers: [
        {
          provide: JwtStrategy,
          useFactory: (config: ConfigService, usersService: UsersService) =>
            new JwtStrategy(config, usersService),
          inject: [ConfigService, UsersService]
        },
        JwtAuthGuard,
        { provide: AuthService, useValue: {} },
        { provide: AuthCookieService, useValue: {} },
        {
          provide: UsersService,
          useValue: { findById: (id: string) => Promise.resolve(id === user.id ? user : null) }
        },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => accessSecret }
        }
      ]
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
    jwtService = module.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('nega la richiesta senza access token', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });

  it('restituisce l’utente con un access token valido', async () => {
    const token = await jwtService.signAsync(
      { sub: user.id, email: user.email, type: 'access' },
      { secret: accessSecret, algorithm: 'HS256', expiresIn: '15m' }
    );
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toMatchObject({ id: user.id, email: user.email });
    expect(response.body).not.toHaveProperty('passwordHash');
  });
});
