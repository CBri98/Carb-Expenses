import type {
  AccentColor,
  CalendarViewPreference,
  ExpenseStatus,
  PaymentMethod,
  ThemeMode,
  User,
  UserPreference,
} from '@prisma/client';

export interface SettingsResponse {
  account: {
    id: string;
    email: string;
    firstName: string;
    lastName: string | null;
    createdAt: string;
    updatedAt: string;
  };
  appearance: {
    themeMode: ThemeMode;
    accentColor: AccentColor;
  };
  experience: {
    sidebarCollapsedByDefault: boolean;
    compactTables: boolean;
    defaultPageSize: number;
    rememberExpenseFilters: boolean;
    defaultExpenseStatus: ExpenseStatus;
    defaultPaymentMethod: PaymentMethod | null;
    defaultCalendarView: CalendarViewPreference;
    dashboardTrendMonths: number;
  };
  icons: {
    enabledCategoryIcons: string[];
    enabledLabelIcons: string[];
  };
  notifications: {
    defaultReminderTime: string;
    defaultReminderTypes: string[];
    dueTodayEnabled: boolean;
    overdueEnabled: boolean;
  };
}

export type UserWithPreference = User & { preference: UserPreference | null };
