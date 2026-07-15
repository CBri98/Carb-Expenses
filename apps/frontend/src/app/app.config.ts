import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it';
import {
  provideHttpClient,
  withFetch,
  withInterceptors
} from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { AuthService } from './core/auth/auth.service';
import { authRefreshInterceptor } from './core/auth/interceptors/auth-refresh.interceptor';
import { authTokenInterceptor } from './core/auth/interceptors/auth-token.interceptor';
import { routes } from './app.routes';

registerLocaleData(localeIt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(
      withFetch(),
      withInterceptors([authTokenInterceptor, authRefreshInterceptor])
    ),
    provideRouter(routes),
    provideClientHydration(),
    provideAppInitializer(() => inject(AuthService).restoreSession()),
    { provide: LOCALE_ID, useValue: 'it-IT' }
  ]
};
