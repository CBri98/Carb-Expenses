import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';

import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../services/notification.service';
import { SettingsStore } from '../services/settings.store';
import { ToastService } from '../services/toast.service';
import { AppLayoutComponent } from './app-layout.component';

describe('AppLayoutComponent', () => {
  it('attiva Impostazioni solo sulle route delle preferenze', async () => {
    const router = { url: '/settings/categories?active=true', navigate: vi.fn().mockResolvedValue(true) };
    await TestBed.configureTestingModule({
      imports: [AppLayoutComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: { user: signal(null), logout: vi.fn(() => of(undefined)) } },
        { provide: NotificationService, useValue: { unreadCount: signal(0), reset: vi.fn() } },
        { provide: ToastService, useValue: { message: signal(null), show: vi.fn(), dismiss: vi.fn() } },
        { provide: SettingsStore, useValue: { experience: signal({ sidebarCollapsedByDefault: false }), loaded: signal(true), error: signal(null), ensureLoaded: vi.fn(), clearSession: vi.fn() } },
      ],
    }).overrideComponent(AppLayoutComponent, { set: { template: '' } }).compileComponents();

    const component = TestBed.createComponent(AppLayoutComponent).componentInstance;
    expect(component.isSettingsActive()).toBe(false);
    router.url = '/settings/labels';
    expect(component.isSettingsActive()).toBe(false);
    router.url = '/settings/account';
    expect(component.isSettingsActive()).toBe(true);
    router.url = '/settings/appearance?theme=dark';
    expect(component.isSettingsActive()).toBe(true);
  });
});
