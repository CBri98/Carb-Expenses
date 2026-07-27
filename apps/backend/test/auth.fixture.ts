import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { vi } from 'vitest';

import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersService } from '../src/users/users.service';

export interface StoredToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  user: User;
}

export function createAuthFixture(): {
  service: AuthService;
  users: Map<string, User>;
  tokens: Map<string, StoredToken>;
} {
  const users = new Map<string, User>();
  const tokens = new Map<string, StoredToken>();
  const usersService = {
    findByEmail: vi.fn((email: string) => Promise.resolve(users.get(email) ?? null)),
    findById: vi.fn((id: string) =>
      Promise.resolve([...users.values()].find((user) => user.id === id) ?? null)
    ),
    create: vi.fn((input: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date();
      const user: User = {
        ...input,
        id: `user-${users.size + 1}`,
        lastName: input.lastName ?? null,
        createdAt: now,
        updatedAt: now
      };
      users.set(user.email, user);
      return Promise.resolve(user);
    })
  };
  const delegate = {
    create: vi.fn((args: { data: Omit<StoredToken, 'revokedAt' | 'user'> }) => {
      const user = [...users.values()].find((item) => item.id === args.data.userId);
      if (!user) throw new Error('Utente test non trovato');
      const stored = { ...args.data, revokedAt: null, user };
      tokens.set(stored.id, stored);
      return Promise.resolve(stored);
    }),
    findUnique: vi.fn((args: { where: { id: string } }) =>
      Promise.resolve(tokens.get(args.where.id) ?? null)
    ),
    updateMany: vi.fn((args: {
      where: { id?: string | { not: string }; userId: string; revokedAt: null };
      data: { revokedAt: Date };
    }) => {
      let count = 0;
      for (const stored of tokens.values()) {
        const idMatches = typeof args.where.id === 'string'
          ? stored.id === args.where.id
          : args.where.id && 'not' in args.where.id
            ? stored.id !== args.where.id.not
            : true;
        if (!idMatches || stored.userId !== args.where.userId || stored.revokedAt) continue;
        stored.revokedAt = args.data.revokedAt;
        count += 1;
      }
      return Promise.resolve({ count });
    })
  };
  const prisma = {
    refreshToken: delegate,
    $transaction: vi.fn((callback: (tx: { refreshToken: typeof delegate }) => unknown) =>
      Promise.resolve(callback({ refreshToken: delegate }))
    )
  };
  const values: Record<string, string> = {
    JWT_ACCESS_SECRET: 'test_access_secret_that_is_long_enough_2026',
    JWT_REFRESH_SECRET: 'test_refresh_secret_that_is_different_2026',
    JWT_ACCESS_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '30d',
    DEFAULT_CURRENCY: 'EUR',
    DEFAULT_TIMEZONE: 'Europe/Rome'
  };
  const config = { getOrThrow: (key: string): string => values[key] as string };
  const service = new AuthService(
    usersService as unknown as UsersService,
    prisma as unknown as PrismaService,
    new JwtService(),
    config as unknown as ConfigService
  );
  return { service, users, tokens };
}
