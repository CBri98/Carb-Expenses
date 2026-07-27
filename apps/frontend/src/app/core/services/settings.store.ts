import { isPlatformBrowser } from '@angular/common';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import {
  catchError,
  finalize,
  of,
  shareReplay,
  tap,
  throwError,
  type Observable,
} from 'rxjs';

import { AuthStateService } from '../auth/auth-state.service';
import {
  DEFAULT_CATEGORY_ICONS,
  DEFAULT_LABEL_ICONS,
  ICON_KEYS,
} from '../../shared/models/icon-catalog';
import type {
  AppearanceSettings,
  ExperienceSettings,
  IconSettings,
  PreferenceCache,
  ReminderSettings,
  ChangePasswordRequest,
  UpdateAccountRequest,
  UserSettings,
} from '../../shared/models/settings.models';
import { SettingsService } from './settings.service';
import { ThemeService } from './theme.service';

export const SETTINGS_CACHE_KEY = 'carbexpenses.preferences.v1';

const DEFAULT_PREFERENCES: PreferenceCache = {
  appearance: { themeMode: 'SYSTEM', accentColor: 'INDIGO' },
  experience: {
    sidebarCollapsedByDefault: false,
    compactTables: false,
    defaultPageSize: 20,
    rememberExpenseFilters: true,
    defaultExpenseStatus: 'COMPLETED',
    defaultPaymentMethod: null,
    defaultCalendarView: 'MONTH',
    dashboardTrendMonths: 12,
  },
  icons: {
    enabledCategoryIcons: [...DEFAULT_CATEGORY_ICONS],
    enabledLabelIcons: [...DEFAULT_LABEL_ICONS],
  },
  notifications: {
    defaultReminderTime: '09:00',
    defaultReminderTypes: ['THREE_DAYS_BEFORE', 'SAME_DAY'],
    dueTodayEnabled: true,
    overdueEnabled: true,
  },
};

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly api = inject(SettingsService);
  private readonly authState = inject(AuthStateService);
  private readonly theme = inject(ThemeService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly preferencesState = signal<PreferenceCache>(this.readCache());
  private readonly settingsState = signal<UserSettings | null>(null);
  private loadRequest: Observable<UserSettings> | null = null;

  readonly settings = this.settingsState.asReadonly();
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);
  readonly appearance = computed(() => this.preferencesState().appearance);
  readonly experience = computed(() => this.preferencesState().experience);
  readonly icons = computed(() => this.preferencesState().icons);
  readonly notifications = computed(() => this.preferencesState().notifications);

  constructor() {
    const cached = this.preferencesState();
    this.theme.apply(cached.appearance, cached.experience.compactTables);
  }

  load(force = false): Observable<UserSettings> {
    let existing = this.settingsState();
    const currentUserId = this.authState.user()?.id;
    if (existing && currentUserId && existing.account.id !== currentUserId) {
      this.settingsState.set(null);
      this.loaded.set(false);
      existing = null;
      force = true;
    }
    if (existing && !force) return of(existing);
    if (this.loadRequest && !force) return this.loadRequest;
    this.loading.set(true);
    this.error.set(null);
    this.loadRequest = this.api.get().pipe(
      tap((settings) => this.apply(settings)),
      catchError((error: unknown) => {
        this.error.set('Non è stato possibile caricare le impostazioni.');
        return throwError(() => error);
      }),
      finalize(() => {
        this.loading.set(false);
        this.loadRequest = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.loadRequest;
  }

  ensureLoaded(): void {
    this.load().subscribe({ error: () => undefined });
  }

  clearSession(): void {
    this.settingsState.set(null);
    this.loaded.set(false);
    this.error.set(null);
    this.loadRequest = null;
  }

  updateAccount(request: UpdateAccountRequest): Observable<UserSettings> {
    return this.api.updateAccount(request).pipe(
      tap((settings) => {
        this.apply(settings);
        this.authState.updateUser(settings.account);
      }),
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<{ revokedCount: number }> {
    return this.api.changePassword(request);
  }

  revokeOtherSessions(): Observable<{ revokedCount: number; currentSessionRetained: boolean }> {
    return this.api.revokeOtherSessions();
  }

  updateAppearance(request: Partial<AppearanceSettings>): Observable<UserSettings> {
    return this.optimistic('appearance', request, () => this.api.updateAppearance(request));
  }

  updateExperience(request: Partial<ExperienceSettings>): Observable<UserSettings> {
    return this.optimistic('experience', request, () => this.api.updateExperience(request));
  }

  updateIcons(request: Partial<IconSettings>): Observable<UserSettings> {
    return this.api.updateIcons(request).pipe(tap((settings) => this.apply(settings)));
  }

  updateNotifications(request: Partial<ReminderSettings>): Observable<UserSettings> {
    return this.api.updateNotifications(request).pipe(tap((settings) => this.apply(settings)));
  }

  reset(): Observable<UserSettings> {
    return this.api.reset().pipe(tap((settings) => this.apply(settings)));
  }

  private optimistic<K extends 'appearance' | 'experience'>(
    section: K,
    request: Partial<PreferenceCache[K]>,
    persist: () => Observable<UserSettings>,
  ): Observable<UserSettings> {
    const previous = this.preferencesState();
    this.setPreferences({
      ...previous,
      [section]: { ...previous[section], ...request },
    });
    return persist().pipe(
      tap((settings) => this.apply(settings)),
      catchError((error: unknown) => {
        this.setPreferences(previous);
        return throwError(() => error);
      }),
    );
  }

  private apply(settings: UserSettings): void {
    this.settingsState.set(settings);
    this.loaded.set(true);
    this.setPreferences({
      appearance: settings.appearance,
      experience: settings.experience,
      icons: sanitizeIcons(settings.icons),
      notifications: settings.notifications,
    });
  }

  private setPreferences(preferences: PreferenceCache): void {
    this.preferencesState.set(preferences);
    this.theme.apply(preferences.appearance, preferences.experience.compactTables);
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      window.localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(preferences));
    } catch {
      // Le preferenze restano valide in memoria quando lo storage non è disponibile.
    }
  }

  private readCache(): PreferenceCache {
    if (!isPlatformBrowser(this.platformId)) return cloneDefaults();
    try {
      const raw = window.localStorage.getItem(SETTINGS_CACHE_KEY);
      if (!raw) return cloneDefaults();
      return normalizeCache(JSON.parse(raw) as unknown);
    } catch {
      return cloneDefaults();
    }
  }
}

function normalizeCache(value: unknown): PreferenceCache {
  if (!isRecord(value)) return cloneDefaults();
  const result = cloneDefaults();
  if (isRecord(value['appearance'])) {
    const theme = value['appearance']['themeMode'];
    const accent = value['appearance']['accentColor'];
    if (theme === 'LIGHT' || theme === 'DARK' || theme === 'SYSTEM') result.appearance.themeMode = theme;
    if (['INDIGO', 'LAVENDER', 'SKY', 'MINT', 'CORAL', 'ROSE'].includes(String(accent))) {
      result.appearance.accentColor = accent as AppearanceSettings['accentColor'];
    }
  }
  if (isRecord(value['experience'])) {
    const source = value['experience'];
    if (typeof source['sidebarCollapsedByDefault'] === 'boolean') result.experience.sidebarCollapsedByDefault = source['sidebarCollapsedByDefault'];
    if (typeof source['compactTables'] === 'boolean') result.experience.compactTables = source['compactTables'];
    if ([10, 20, 50, 100].includes(Number(source['defaultPageSize']))) result.experience.defaultPageSize = Number(source['defaultPageSize']);
    if (typeof source['rememberExpenseFilters'] === 'boolean') result.experience.rememberExpenseFilters = source['rememberExpenseFilters'];
    if (source['defaultExpenseStatus'] === 'COMPLETED' || source['defaultExpenseStatus'] === 'PLANNED') result.experience.defaultExpenseStatus = source['defaultExpenseStatus'];
    const payment = source['defaultPaymentMethod'];
    if (payment === null || (typeof payment === 'string' && ['CASH','DEBIT_CARD','CREDIT_CARD','BANK_TRANSFER','DIRECT_DEBIT','DIGITAL_WALLET','CHECK','OTHER'].includes(payment))) {
      result.experience.defaultPaymentMethod = payment as ExperienceSettings['defaultPaymentMethod'];
    }
    if (source['defaultCalendarView'] === 'MONTH' || source['defaultCalendarView'] === 'WEEK' || source['defaultCalendarView'] === 'LIST') result.experience.defaultCalendarView = source['defaultCalendarView'];
    if (source['dashboardTrendMonths'] === 6 || source['dashboardTrendMonths'] === 12) result.experience.dashboardTrendMonths = source['dashboardTrendMonths'];
  }
  if (isRecord(value['icons'])) result.icons = sanitizeIcons(value['icons']);
  if (isRecord(value['notifications'])) {
    const source = value['notifications'];
    if (typeof source['defaultReminderTime'] === 'string' && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(source['defaultReminderTime'])) result.notifications.defaultReminderTime = source['defaultReminderTime'];
    if (Array.isArray(source['defaultReminderTypes'])) result.notifications.defaultReminderTypes = source['defaultReminderTypes'].filter((item): item is ReminderSettings['defaultReminderTypes'][number] => typeof item === 'string' && ['SAME_DAY', 'ONE_DAY_BEFORE', 'THREE_DAYS_BEFORE', 'SEVEN_DAYS_BEFORE'].includes(item));
    if (typeof source['dueTodayEnabled'] === 'boolean') result.notifications.dueTodayEnabled = source['dueTodayEnabled'];
    if (typeof source['overdueEnabled'] === 'boolean') result.notifications.overdueEnabled = source['overdueEnabled'];
  }
  return result;
}

function sanitizeIcons(value: { enabledCategoryIcons?: unknown; enabledLabelIcons?: unknown }): IconSettings {
  const known = new Set(ICON_KEYS);
  const category = Array.isArray(value.enabledCategoryIcons)
    ? value.enabledCategoryIcons.filter((item): item is string => typeof item === 'string' && known.has(item))
    : [];
  const label = Array.isArray(value.enabledLabelIcons)
    ? value.enabledLabelIcons.filter((item): item is string => typeof item === 'string' && known.has(item))
    : [];
  return {
    enabledCategoryIcons: category.length ? category : [...DEFAULT_CATEGORY_ICONS],
    enabledLabelIcons: label.length ? label : [...DEFAULT_LABEL_ICONS],
  };
}

function cloneDefaults(): PreferenceCache {
  return JSON.parse(JSON.stringify(DEFAULT_PREFERENCES)) as PreferenceCache;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
