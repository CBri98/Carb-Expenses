import {
  AccentColor,
  CalendarViewPreference,
  ExpenseStatus,
  ThemeMode,
  type Prisma,
} from '@prisma/client';

export const CATEGORY_ICON_DEFAULTS = [
  'bi-house', 'bi-house-door', 'bi-building', 'bi-receipt', 'bi-basket',
  'bi-cup-hot', 'bi-bus-front', 'bi-fuel-pump', 'bi-car-front', 'bi-heart-pulse',
  'bi-capsule', 'bi-bag', 'bi-controller', 'bi-airplane', 'bi-arrow-repeat',
  'bi-mortarboard', 'bi-gift', 'bi-bank', 'bi-briefcase', 'bi-cart', 'bi-phone',
  'bi-laptop', 'bi-tools', 'bi-lightning', 'bi-piggy-bank', 'bi-stars',
  'bi-trophy', 'bi-feather', 'bi-shield-check', 'bi-people', 'bi-three-dots',
] as const;

export const LABEL_ICON_DEFAULTS = [
  'bi-tag', 'bi-heart', 'bi-briefcase', 'bi-gift', 'bi-house-door', 'bi-airplane',
  'bi-stars', 'bi-receipt', 'bi-cart-check', 'bi-phone', 'bi-laptop', 'bi-tools',
  'bi-lightning', 'bi-piggy-bank', 'bi-trophy', 'bi-feather', 'bi-people', 'bi-three-dots',
] as const;

// Mantiene la validazione API allineata al catalogo selezionabile nel frontend.
export const ALLOWED_ICON_KEYS = [
  'bi-tag', 'bi-stars', 'bi-bookmark', 'bi-calendar-check', 'bi-arrow-repeat',
  'bi-three-dots', 'bi-house', 'bi-house-door', 'bi-building', 'bi-lightbulb',
  'bi-lightning', 'bi-tools', 'bi-droplet', 'bi-basket', 'bi-cart', 'bi-cup-hot',
  'bi-egg-fried', 'bi-cake2', 'bi-cup-straw', 'bi-car-front', 'bi-bus-front',
  'bi-train-front', 'bi-fuel-pump', 'bi-bicycle', 'bi-ev-station', 'bi-heart-pulse',
  'bi-capsule', 'bi-hospital', 'bi-bandaid', 'bi-thermometer-half', 'bi-briefcase',
  'bi-person-workspace', 'bi-clipboard-check', 'bi-graph-up-arrow',
  'bi-file-earmark-spreadsheet', 'bi-mortarboard', 'bi-book', 'bi-journal-text',
  'bi-pencil', 'bi-backpack', 'bi-bag', 'bi-bag-heart', 'bi-basket2', 'bi-cart-check',
  'bi-shop-window', 'bi-phone', 'bi-laptop', 'bi-pc-display', 'bi-smartwatch',
  'bi-router', 'bi-cloud', 'bi-controller', 'bi-film', 'bi-music-note-beamed',
  'bi-headphones', 'bi-camera', 'bi-palette', 'bi-trophy', 'bi-person-walking',
  'bi-person-arms-up', 'bi-stopwatch', 'bi-water', 'bi-airplane', 'bi-luggage',
  'bi-map', 'bi-compass', 'bi-globe-europe-africa', 'bi-passport', 'bi-bank',
  'bi-piggy-bank', 'bi-cash-stack', 'bi-credit-card', 'bi-wallet2', 'bi-receipt',
  'bi-currency-euro', 'bi-calculator', 'bi-feather', 'bi-egg', 'bi-flower2',
  'bi-feather2', 'bi-bug', 'bi-wrench-adjustable', 'bi-shield-check', 'bi-key',
  'bi-wifi', 'bi-telephone', 'bi-envelope', 'bi-gift', 'bi-balloon', 'bi-flower1',
  'bi-gem', 'bi-box2-heart', 'bi-people', 'bi-person-hearts', 'bi-house-heart',
  'bi-emoji-smile', 'bi-heart',
] as const;

export const DEFAULT_REMINDER_TYPES = ['THREE_DAYS_BEFORE', 'SAME_DAY'] as const;
export const DEFAULT_REMINDER_TIME = '09:00';

export function defaultPreferenceData(): Omit<Prisma.UserPreferenceUncheckedCreateInput, 'userId'> {
  return {
    themeMode: ThemeMode.SYSTEM,
    accentColor: AccentColor.INDIGO,
    sidebarCollapsedByDefault: false,
    compactTables: false,
    defaultPageSize: 20,
    rememberExpenseFilters: true,
    defaultExpenseStatus: ExpenseStatus.COMPLETED,
    defaultPaymentMethod: null,
    defaultCalendarView: CalendarViewPreference.MONTH,
    dashboardTrendMonths: 12,
    defaultReminderTime: timeValue(DEFAULT_REMINDER_TIME),
    defaultReminderTypes: [...DEFAULT_REMINDER_TYPES],
    dueTodayEnabled: true,
    overdueEnabled: true,
    enabledCategoryIcons: [...CATEGORY_ICON_DEFAULTS],
    enabledLabelIcons: [...LABEL_ICON_DEFAULTS],
  };
}

export function timeValue(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}
