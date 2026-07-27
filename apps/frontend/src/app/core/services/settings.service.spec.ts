import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { SettingsService } from './settings.service';
import type { UserSettings } from '../../shared/models/settings.models';

const settings: UserSettings = {
  account: { id: 'user-1', email: 'utente@example.com', firstName: 'Utente', lastName: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' },
  appearance: { themeMode: 'SYSTEM', accentColor: 'INDIGO' },
  experience: { sidebarCollapsedByDefault: false, compactTables: false, defaultPageSize: 20, rememberExpenseFilters: true, defaultExpenseStatus: 'COMPLETED', defaultPaymentMethod: null, defaultCalendarView: 'MONTH', dashboardTrendMonths: 6 },
  icons: { enabledCategoryIcons: ['bi-house'], enabledLabelIcons: ['bi-tag'] },
  notifications: { defaultReminderTime: '09:00', defaultReminderTypes: ['SAME_DAY'], dueTodayEnabled: true, overdueEnabled: true },
};

describe('SettingsService', () => {
  it('usa endpoint distinti e restituisce il payload del wrapper', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(SettingsService);
    const http = TestBed.inject(HttpTestingController);
    let received: UserSettings | undefined;
    service.updateAppearance({ themeMode: 'DARK', accentColor: 'MINT' }).subscribe((value) => { received = value; });
    const request = http.expectOne((item) => item.url.endsWith('/settings/appearance'));
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ themeMode: 'DARK', accentColor: 'MINT' });
    request.flush({ data: settings, meta: {}, message: 'OK' });
    expect(received).toEqual(settings);
    http.verify();
  });

  it('revoca le altre sessioni inviando le credenziali cookie', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(SettingsService);
    const http = TestBed.inject(HttpTestingController);
    service.revokeOtherSessions().subscribe();
    const request = http.expectOne((item) => item.url.endsWith('/settings/account/revoke-other-sessions'));
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ data: { revokedCount: 2, currentSessionRetained: true }, meta: {}, message: 'OK' });
    http.verify();
  });
});
