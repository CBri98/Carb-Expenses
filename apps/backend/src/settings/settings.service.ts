import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, type User, type UserPreference } from '@prisma/client';

import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import type {
  ChangePasswordDto,
  UpdateAccountDto,
  UpdateAppearancePreferencesDto,
  UpdateExperiencePreferencesDto,
  UpdateIconPreferencesDto,
  UpdateNotificationPreferencesDto,
} from './dto/settings.dto';
import {
  CATEGORY_ICON_DEFAULTS,
  DEFAULT_REMINDER_TIME,
  DEFAULT_REMINDER_TYPES,
  LABEL_ICON_DEFAULTS,
  defaultPreferenceData,
  timeValue,
} from './settings.defaults';
import type { SettingsResponse } from './settings.types';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  async get(userId: string): Promise<SettingsResponse> {
    const user = await this.userOrThrow(userId);
    const preference = user.preference ?? (await this.createPreference(userId));
    return toResponse(user, preference);
  }

  async updateAccount(
    userId: string,
    dto: UpdateAccountDto,
    refreshToken: string | undefined,
  ): Promise<SettingsResponse> {
    const current = await this.userOrThrow(userId);
    const emailChanged = dto.email !== undefined && dto.email !== current.email;
    if (emailChanged) {
      if (!dto.currentPassword || !(await this.auth.verifyPassword(current, dto.currentPassword))) {
        throw new UnauthorizedException('Password corrente non corretta');
      }
    }
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
          ...(dto.lastName !== undefined ? { lastName: dto.lastName?.trim() || null } : {}),
          ...(dto.email !== undefined ? { email: dto.email } : {}),
        },
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException('Non è possibile usare l’indirizzo email indicato');
      }
      throw error;
    }
    if (emailChanged) await this.auth.revokeOtherSessions(userId, refreshToken);
    return this.get(userId);
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ revokedCount: number }> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new ConflictException('La conferma della nuova password non corrisponde');
    }
    const user = await this.userOrThrow(userId);
    if (!(await this.auth.verifyPassword(user, dto.currentPassword))) {
      throw new UnauthorizedException('Password corrente non corretta');
    }
    if (await this.auth.verifyPassword(user, dto.newPassword)) {
      throw new ConflictException('La nuova password deve essere diversa da quella corrente');
    }
    const passwordHash = await this.auth.hashPassword(dto.newPassword);
    const revokedCount = await this.prisma.$transaction(async (transaction) => {
      await transaction.user.update({ where: { id: userId }, data: { passwordHash } });
      const revoked = await transaction.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      return revoked.count;
    });
    return { revokedCount };
  }

  revokeOtherSessions(userId: string, refreshToken: string | undefined) {
    return this.auth.revokeOtherSessions(userId, refreshToken);
  }

  async updateAppearance(
    userId: string,
    dto: UpdateAppearancePreferencesDto,
  ): Promise<SettingsResponse> {
    await this.updatePreference(userId, dto);
    return this.get(userId);
  }

  async updateExperience(
    userId: string,
    dto: UpdateExperiencePreferencesDto,
  ): Promise<SettingsResponse> {
    await this.updatePreference(userId, dto);
    return this.get(userId);
  }

  async updateIcons(userId: string, dto: UpdateIconPreferencesDto): Promise<SettingsResponse> {
    await this.updatePreference(userId, {
      ...(dto.enabledCategoryIcons
        ? { enabledCategoryIcons: dto.enabledCategoryIcons }
        : {}),
      ...(dto.enabledLabelIcons ? { enabledLabelIcons: dto.enabledLabelIcons } : {}),
    });
    return this.get(userId);
  }

  async updateNotifications(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<SettingsResponse> {
    await this.updatePreference(userId, {
      ...(dto.defaultReminderTime
        ? { defaultReminderTime: timeValue(dto.defaultReminderTime) }
        : {}),
      ...(dto.defaultReminderTypes
        ? { defaultReminderTypes: dto.defaultReminderTypes }
        : {}),
      ...(dto.dueTodayEnabled !== undefined
        ? { dueTodayEnabled: dto.dueTodayEnabled }
        : {}),
      ...(dto.overdueEnabled !== undefined
        ? { overdueEnabled: dto.overdueEnabled }
        : {}),
    });
    return this.get(userId);
  }

  async reset(userId: string): Promise<SettingsResponse> {
    await this.userOrThrow(userId);
    const defaults = defaultPreferenceData();
    await this.prisma.userPreference.upsert({
      where: { userId },
      create: { ...defaults, userId },
      update: defaults,
    });
    return this.get(userId);
  }

  private async updatePreference(
    userId: string,
    data: Prisma.UserPreferenceUncheckedUpdateInput,
  ): Promise<void> {
    await this.userOrThrow(userId);
    const defaults = defaultPreferenceData();
    await this.prisma.userPreference.upsert({
      where: { userId },
      create: { ...defaults, userId, ...data } as Prisma.UserPreferenceUncheckedCreateInput,
      update: data,
    });
  }

  private async userOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { preference: true },
    });
    if (!user) throw new NotFoundException('Utente non trovato');
    return user;
  }

  private createPreference(userId: string): Promise<UserPreference> {
    return this.prisma.userPreference.upsert({
      where: { userId },
      create: { ...defaultPreferenceData(), userId },
      update: {},
    });
  }
}

function toResponse(user: User, preference: UserPreference): SettingsResponse {
  return {
    account: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    },
    appearance: {
      themeMode: preference.themeMode,
      accentColor: preference.accentColor,
    },
    experience: {
      sidebarCollapsedByDefault: preference.sidebarCollapsedByDefault,
      compactTables: preference.compactTables,
      defaultPageSize: preference.defaultPageSize,
      rememberExpenseFilters: preference.rememberExpenseFilters,
      defaultExpenseStatus: preference.defaultExpenseStatus,
      defaultPaymentMethod: preference.defaultPaymentMethod,
      defaultCalendarView: preference.defaultCalendarView,
      dashboardTrendMonths: preference.dashboardTrendMonths,
    },
    icons: {
      enabledCategoryIcons: stringArray(
        preference.enabledCategoryIcons,
        CATEGORY_ICON_DEFAULTS,
      ),
      enabledLabelIcons: stringArray(preference.enabledLabelIcons, LABEL_ICON_DEFAULTS),
    },
    notifications: {
      defaultReminderTime: timeString(preference.defaultReminderTime),
      defaultReminderTypes: stringArray(
        preference.defaultReminderTypes,
        DEFAULT_REMINDER_TYPES,
      ),
      dueTodayEnabled: preference.dueTodayEnabled,
      overdueEnabled: preference.overdueEnabled,
    },
  };
}

function stringArray(value: Prisma.JsonValue | null, fallback: readonly string[]): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? [...value]
    : [...fallback];
}

function timeString(value: Date | null): string {
  return value
    ? `${String(value.getUTCHours()).padStart(2, '0')}:${String(value.getUTCMinutes()).padStart(2, '0')}`
    : DEFAULT_REMINDER_TIME;
}

function isUniqueConstraintError(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
