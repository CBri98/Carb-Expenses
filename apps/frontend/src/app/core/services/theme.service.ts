import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

import type { AppearanceSettings, ThemeMode } from '../../shared/models/settings.models';

const THEMES = ['LIGHT', 'DARK', 'SYSTEM'] as const;
const ACCENTS = ['INDIGO', 'LAVENDER', 'SKY', 'MINT', 'CORAL', 'ROSE'] as const;

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private mediaQuery: MediaQueryList | null = null;
  private mode: ThemeMode = 'SYSTEM';
  private readonly mediaListener = () => this.applyResolvedTheme();

  apply(appearance: AppearanceSettings, compactTables = false): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.mode = THEMES.includes(appearance.themeMode) ? appearance.themeMode : 'SYSTEM';
    const accent = ACCENTS.includes(appearance.accentColor) ? appearance.accentColor : 'INDIGO';
    const root = document.documentElement;
    root.dataset['accent'] = accent.toLowerCase();
    root.dataset['density'] = compactTables ? 'compact' : 'comfortable';
    this.listenToSystem(this.mode === 'SYSTEM');
    this.applyResolvedTheme();
  }

  private applyResolvedTheme(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const dark = this.mode === 'DARK' || (this.mode === 'SYSTEM' && this.systemDark());
    const resolved = dark ? 'dark' : 'light';
    const root = document.documentElement;
    root.dataset['theme'] = resolved;
    root.dataset['themeMode'] = this.mode.toLowerCase();
    root.dataset['bsTheme'] = resolved;
    root.style.colorScheme = resolved;
  }

  private listenToSystem(enabled: boolean): void {
    if (typeof window.matchMedia !== 'function') return;
    this.mediaQuery ??= window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.removeEventListener('change', this.mediaListener);
    if (enabled) this.mediaQuery.addEventListener('change', this.mediaListener);
  }

  private systemDark(): boolean {
    if (typeof window.matchMedia !== 'function') return false;
    this.mediaQuery ??= window.matchMedia('(prefers-color-scheme: dark)');
    return this.mediaQuery.matches;
  }
}
