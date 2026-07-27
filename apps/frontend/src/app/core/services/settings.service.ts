import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import type { ApiEnvelope } from '../auth/auth.models';
import type {
  AppearanceSettings,
  ChangePasswordRequest,
  ExperienceSettings,
  IconSettings,
  ReminderSettings,
  UpdateAccountRequest,
  UserSettings,
} from '../../shared/models/settings.models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/settings`;

  get(): Observable<UserSettings> {
    return this.http.get<ApiEnvelope<UserSettings>>(this.baseUrl).pipe(mapData());
  }

  updateAccount(request: UpdateAccountRequest): Observable<UserSettings> {
    return this.http.patch<ApiEnvelope<UserSettings>>(`${this.baseUrl}/account`, request).pipe(mapData());
  }

  changePassword(request: ChangePasswordRequest): Observable<{ revokedCount: number }> {
    return this.http
      .patch<ApiEnvelope<{ revokedCount: number }>>(`${this.baseUrl}/account/password`, request)
      .pipe(mapData());
  }

  revokeOtherSessions(): Observable<{ revokedCount: number; currentSessionRetained: boolean }> {
    return this.http
      .post<ApiEnvelope<{ revokedCount: number; currentSessionRetained: boolean }>>(
        `${this.baseUrl}/account/revoke-other-sessions`,
        {},
        { withCredentials: true },
      )
      .pipe(mapData());
  }

  updateAppearance(request: Partial<AppearanceSettings>): Observable<UserSettings> {
    return this.patch('appearance', request);
  }

  updateExperience(request: Partial<ExperienceSettings>): Observable<UserSettings> {
    return this.patch('experience', request);
  }

  updateIcons(request: Partial<IconSettings>): Observable<UserSettings> {
    return this.patch('icons', request);
  }

  updateNotifications(request: Partial<ReminderSettings>): Observable<UserSettings> {
    return this.patch('notifications', request);
  }

  reset(): Observable<UserSettings> {
    return this.http
      .post<ApiEnvelope<UserSettings>>(`${this.baseUrl}/preferences/reset`, {})
      .pipe(mapData());
  }

  private patch<T extends object>(section: string, request: T): Observable<UserSettings> {
    return this.http
      .patch<ApiEnvelope<UserSettings>>(`${this.baseUrl}/${section}`, request)
      .pipe(mapData());
  }
}

function mapData<T>() {
  return map((response: ApiEnvelope<T>) => response.data);
}
