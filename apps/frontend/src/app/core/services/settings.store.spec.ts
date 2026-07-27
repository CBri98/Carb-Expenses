import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthStateService } from '../auth/auth-state.service';
import { SETTINGS_CACHE_KEY, SettingsStore } from './settings.store';
import { SettingsService } from './settings.service';
import type { UserSettings } from '../../shared/models/settings.models';

const serverSettings: UserSettings = {
  account: { id: 'user-1', email: 'utente@example.com', firstName: 'Utente', lastName: 'Demo', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-07-18T00:00:00.000Z' },
  appearance: { themeMode: 'DARK', accentColor: 'MINT' },
  experience: { sidebarCollapsedByDefault: true, compactTables: true, defaultPageSize: 50, rememberExpenseFilters: false, defaultExpenseStatus: 'PLANNED', defaultPaymentMethod: 'BANK_TRANSFER', defaultCalendarView: 'LIST', dashboardTrendMonths: 12 },
  icons: { enabledCategoryIcons: ['bi-house', 'chiave-obsoleta'], enabledLabelIcons: ['bi-tag'] },
  notifications: { defaultReminderTime: '08:30', defaultReminderTypes: ['THREE_DAYS_BEFORE'], dueTodayEnabled: false, overdueEnabled: true },
};

describe('SettingsStore', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [
      { provide: SettingsService, useValue: { get: vi.fn(() => of(serverSettings)) } },
      AuthStateService,
    ] });
  });
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.removeAttribute('data-accent');
    document.documentElement.removeAttribute('data-density');
    localStorage.clear();
  });

  it('riconcilia la cache con il server, applica dark mode e ignora icone obsolete', async () => {
    const store = TestBed.inject(SettingsStore);
    await firstValueFrom(store.load());
    expect(store.experience().defaultPageSize).toBe(50);
    expect(store.icons().enabledCategoryIcons).toEqual(['bi-house']);
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(document.documentElement.dataset['accent']).toBe('mint');
    expect(document.documentElement.dataset['density']).toBe('compact');
    const cached = JSON.parse(localStorage.getItem(SETTINGS_CACHE_KEY) ?? '{}') as Record<string, unknown>;
    expect(cached['account']).toBeUndefined();
  });
});
