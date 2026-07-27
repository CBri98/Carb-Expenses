import type { ExpenseStatus, PaymentMethod } from './expense.models';
import type { ReminderType } from './notification.models';

export type ThemeMode = 'LIGHT' | 'DARK' | 'SYSTEM';
export type AccentColor = 'INDIGO' | 'LAVENDER' | 'SKY' | 'MINT' | 'CORAL' | 'ROSE';
export type CalendarViewPreference = 'MONTH' | 'WEEK' | 'LIST';
export type ReminderPreset = Exclude<ReminderType, 'CUSTOM'>;

export interface AccountSettings {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AppearanceSettings {
  themeMode: ThemeMode;
  accentColor: AccentColor;
}

export interface ExperienceSettings {
  sidebarCollapsedByDefault: boolean;
  compactTables: boolean;
  defaultPageSize: number;
  rememberExpenseFilters: boolean;
  defaultExpenseStatus: Extract<ExpenseStatus, 'COMPLETED' | 'PLANNED'>;
  defaultPaymentMethod: PaymentMethod | null;
  defaultCalendarView: CalendarViewPreference;
  dashboardTrendMonths: 6 | 12;
}

export interface IconSettings {
  enabledCategoryIcons: string[];
  enabledLabelIcons: string[];
}

export interface ReminderSettings {
  defaultReminderTime: string;
  defaultReminderTypes: ReminderPreset[];
  dueTodayEnabled: boolean;
  overdueEnabled: boolean;
}

export interface UserSettings {
  account: AccountSettings;
  appearance: AppearanceSettings;
  experience: ExperienceSettings;
  icons: IconSettings;
  notifications: ReminderSettings;
}

export type UpdateAccountRequest = Partial<
  Pick<AccountSettings, 'firstName' | 'lastName' | 'email'>
> & { currentPassword?: string };

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PreferenceCache {
  appearance: AppearanceSettings;
  experience: ExperienceSettings;
  icons: IconSettings;
  notifications: ReminderSettings;
}
