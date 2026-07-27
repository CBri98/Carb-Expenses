import { ConflictException, UnauthorizedException } from '@nestjs/common';
import {
  AccentColor,
  CalendarViewPreference,
  ExpenseStatus,
  ThemeMode,
  type User,
  type UserPreference,
} from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { SettingsService } from '../src/settings/settings.service';

const now = new Date('2026-07-18T12:00:00.000Z');

describe('SettingsService', () => {
  let users: Map<string, User>;
  let preferences: Map<string, UserPreference>;
  let prisma: ReturnType<typeof prismaMock>;
  let auth: ReturnType<typeof authMock>;
  let service: SettingsService;

  beforeEach(() => {
    users = new Map([
      ['user-a', user('user-a', 'a@example.com')],
      ['user-b', user('user-b', 'b@example.com')],
    ]);
    preferences = new Map([
      ['user-a', preference('user-a')],
      ['user-b', preference('user-b')],
    ]);
    prisma = prismaMock(users, preferences);
    auth = authMock();
    service = new SettingsService(
      prisma as unknown as PrismaService,
      auth as unknown as AuthService,
    );
  });

  it('isola account e preferenze usando esclusivamente userId autenticato', async () => {
    await service.updateAppearance('user-a', {
      themeMode: ThemeMode.DARK,
      accentColor: AccentColor.MINT,
    });
    const first = await service.get('user-a');
    const second = await service.get('user-b');

    expect(first.account.email).toBe('a@example.com');
    expect(first.appearance).toEqual({ themeMode: ThemeMode.DARK, accentColor: AccentColor.MINT });
    expect(second.account.email).toBe('b@example.com');
    expect(second.appearance.themeMode).toBe(ThemeMode.SYSTEM);
    expect(prisma.userPreference.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-a' } }),
    );
  });

  it('richiede la password corrente per cambiare email e revoca le altre sessioni', async () => {
    auth.verifyPassword.mockResolvedValueOnce(false);
    await expect(service.updateAccount('user-a', {
      email: 'nuova@example.com', currentPassword: 'errata',
    }, 'refresh')).rejects.toBeInstanceOf(UnauthorizedException);

    auth.verifyPassword.mockResolvedValueOnce(true);
    const result = await service.updateAccount('user-a', {
      email: 'nuova@example.com', currentPassword: 'corretta',
    }, 'refresh');
    expect(result.account.email).toBe('nuova@example.com');
    expect(auth.revokeOtherSessions).toHaveBeenCalledWith('user-a', 'refresh');
  });

  it('cambia password soltanto con conferma valida e revoca tutte le sessioni', async () => {
    await expect(service.changePassword('user-a', {
      currentPassword: 'Password1', newPassword: 'Password2', confirmPassword: 'Password3',
    })).rejects.toBeInstanceOf(ConflictException);

    auth.verifyPassword.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    auth.hashPassword.mockResolvedValue('new-hash');
    const result = await service.changePassword('user-a', {
      currentPassword: 'Password1', newPassword: 'Password2', confirmPassword: 'Password2',
    });
    expect(result.revokedCount).toBe(2);
    expect(users.get('user-a')?.passwordHash).toBe('new-hash');
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-a', revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it('ripristina soltanto le preferenze e conserva account e dati utente', async () => {
    preferences.set('user-a', { ...preference('user-a'), themeMode: ThemeMode.DARK });
    const before = users.get('user-a');
    const result = await service.reset('user-a');
    expect(result.appearance.themeMode).toBe(ThemeMode.SYSTEM);
    expect(result.experience.dashboardTrendMonths).toBe(12);
    expect(users.get('user-a')).toEqual(before);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

function user(id: string, email: string): User {
  return {
    id, email, passwordHash: 'hash', firstName: id,
    lastName: null, currency: 'EUR', timezone: 'Europe/Rome', createdAt: now, updatedAt: now,
  };
}

function preference(userId: string): UserPreference {
  return {
    userId, themeMode: ThemeMode.SYSTEM, accentColor: AccentColor.INDIGO,
    sidebarCollapsedByDefault: false, compactTables: false, defaultPageSize: 20,
    rememberExpenseFilters: true, defaultExpenseStatus: ExpenseStatus.COMPLETED,
    defaultPaymentMethod: null, defaultCalendarView: CalendarViewPreference.MONTH,
    dashboardTrendMonths: 6, defaultReminderTime: new Date('1970-01-01T09:00:00.000Z'),
    defaultReminderTypes: ['THREE_DAYS_BEFORE', 'SAME_DAY'], dueTodayEnabled: true,
    overdueEnabled: true, enabledCategoryIcons: ['bi-house'], enabledLabelIcons: ['bi-tag'],
    createdAt: now, updatedAt: now,
  };
}

function authMock() {
  return {
    verifyPassword: vi.fn().mockResolvedValue(true),
    hashPassword: vi.fn().mockResolvedValue('new-hash'),
    revokeOtherSessions: vi.fn().mockResolvedValue({ revokedCount: 1, currentSessionRetained: true }),
  };
}

function prismaMock(users: Map<string, User>, preferences: Map<string, UserPreference>) {
  const userDelegate = {
    findUnique: vi.fn(({ where }: { where: { id: string } }) => {
      const row = users.get(where.id);
      return Promise.resolve(row ? { ...row, preference: preferences.get(where.id) ?? null } : null);
    }),
    update: vi.fn(({ where, data }: { where: { id: string }; data: Partial<User> }) => {
      const row = users.get(where.id);
      if (!row) throw new Error('missing user');
      const updated = { ...row, ...data, updatedAt: now };
      users.set(where.id, updated);
      return Promise.resolve(updated);
    }),
  };
  const preferenceDelegate = {
    create: vi.fn(({ data }: { data: UserPreference }) => { preferences.set(data.userId, data); return Promise.resolve(data); }),
    upsert: vi.fn(({ where, create, update }: { where: { userId: string }; create: UserPreference; update: Partial<UserPreference> }) => {
      const current = preferences.get(where.userId);
      const next = current ? { ...current, ...update } : { ...preference(where.userId), ...create };
      preferences.set(where.userId, next);
      return Promise.resolve(next);
    }),
  };
  const refreshToken = { updateMany: vi.fn().mockResolvedValue({ count: 2 }) };
  const mock = { user: userDelegate, userPreference: preferenceDelegate, refreshToken, $transaction: vi.fn() };
  mock.$transaction.mockImplementation(async (callback) => callback(mock));
  return mock;
}
