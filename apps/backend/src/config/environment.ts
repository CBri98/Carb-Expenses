const SUPPORTED_NODE_ENVIRONMENTS = new Set([
  'development',
  'test',
  'production'
]);
const SUPPORTED_SAME_SITE_VALUES = new Set(['lax', 'strict', 'none']);
const DURATION_PATTERN = /^\d+(ms|s|m|h|d)$/;
const LOCAL_TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const CRON_EVERY_MINUTES_PATTERN = /^\*\/([1-9]|[1-5]\d) \* \* \* \*$/;
const RECURRENCE_CRON_PATTERN = /^(?:[0-5]?\d|\*\/(?:[1-9]|[1-5]\d)) \* \* \* \*$/;

function stringValue(config: Record<string, unknown>, key: string): string {
  const value = config[key];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`La variabile d'ambiente ${key} è obbligatoria`);
  }

  return value.trim();
}

function secretValue(config: Record<string, unknown>, key: string): string {
  const secret = stringValue(config, key);

  if (secret.length < 32) {
    throw new Error(`${key} deve contenere almeno 32 caratteri`);
  }

  return secret;
}

function durationValue(config: Record<string, unknown>, key: string): string {
  const value = stringValue(config, key);

  if (!DURATION_PATTERN.test(value)) {
    throw new Error(`${key} deve usare un formato come 15m oppure 30d`);
  }

  return value;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  const normalized = String(value ?? fallback).toLowerCase();

  if (normalized !== 'true' && normalized !== 'false') {
    throw new Error('COOKIE_SECURE deve essere true oppure false');
  }

  return normalized === 'true';
}

function portValue(value: unknown): number {
  const port = Number(value ?? 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('BACKEND_PORT deve essere una porta TCP valida');
  }

  return port;
}

function reminderTimeValue(value: unknown): string {
  const time = String(value ?? '09:00');
  if (!LOCAL_TIME_PATTERN.test(time)) {
    throw new Error('DEFAULT_EXPENSE_REMINDER_TIME deve usare il formato HH:mm');
  }
  return time;
}

function schedulerCronValue(value: unknown): string {
  const cron = String(value ?? '*/1 * * * *').trim();
  if (!CRON_EVERY_MINUTES_PATTERN.test(cron)) {
    throw new Error('NOTIFICATION_SCHEDULER_CRON deve indicare un intervallo da 1 a 59 minuti');
  }
  return cron;
}

function pollIntervalValue(value: unknown): number {
  const interval = Number(value ?? 60_000);
  if (!Number.isInteger(interval) || interval < 60_000 || interval > 120_000) {
    throw new Error('NOTIFICATION_POLL_INTERVAL_MS deve essere compreso tra 60000 e 120000');
  }
  return interval;
}

function boundedInteger(
  value: unknown,
  fallback: number,
  minimum: number,
  maximum: number,
  key: string,
): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    throw new Error(`${key} deve essere compreso tra ${minimum} e ${maximum}`);
  }
  return parsed;
}

function recurrenceCronValue(value: unknown): string {
  const cron = String(value ?? '0 * * * *').trim();
  if (!RECURRENCE_CRON_PATTERN.test(cron)) {
    throw new Error(
      'RECURRENCE_SCHEDULER_CRON deve indicare un minuto orario o un intervallo da 1 a 59 minuti',
    );
  }
  return cron;
}

export function validateEnvironment(
  config: Record<string, unknown>
): Record<string, unknown> {
  const nodeEnvironment = String(config['NODE_ENV'] ?? 'development');

  if (!SUPPORTED_NODE_ENVIRONMENTS.has(nodeEnvironment)) {
    throw new Error('NODE_ENV deve essere development, test oppure production');
  }

  const accessSecret = secretValue(config, 'JWT_ACCESS_SECRET');
  const refreshSecret = secretValue(config, 'JWT_REFRESH_SECRET');

  if (accessSecret === refreshSecret) {
    throw new Error('I secret JWT access e refresh devono essere differenti');
  }

  const sameSite = String(config['COOKIE_SAME_SITE'] ?? 'lax').toLowerCase();

  if (!SUPPORTED_SAME_SITE_VALUES.has(sameSite)) {
    throw new Error('COOKIE_SAME_SITE deve essere lax, strict oppure none');
  }

  const cookieSecure = booleanValue(config['COOKIE_SECURE'], false);

  if (nodeEnvironment === 'production' && !cookieSecure) {
    throw new Error('COOKIE_SECURE deve essere true in production');
  }

  if (sameSite === 'none' && !cookieSecure) {
    throw new Error('COOKIE_SAME_SITE=none richiede COOKIE_SECURE=true');
  }

  const maximumGenerationDays = boundedInteger(
    config['MAX_RECURRENCE_GENERATION_DAYS_AHEAD'],
    365,
    1,
    3650,
    'MAX_RECURRENCE_GENERATION_DAYS_AHEAD',
  );
  const defaultGenerationDays = boundedInteger(
    config['DEFAULT_RECURRENCE_GENERATION_DAYS_AHEAD'],
    30,
    1,
    maximumGenerationDays,
    'DEFAULT_RECURRENCE_GENERATION_DAYS_AHEAD',
  );

  return {
    ...config,
    NODE_ENV: nodeEnvironment,
    BACKEND_PORT: portValue(config['BACKEND_PORT']),
    DATABASE_URL: stringValue(config, 'DATABASE_URL'),
    CORS_ORIGIN: stringValue(config, 'CORS_ORIGIN'),
    JWT_ACCESS_SECRET: accessSecret,
    JWT_REFRESH_SECRET: refreshSecret,
    JWT_ACCESS_EXPIRES_IN: durationValue(config, 'JWT_ACCESS_EXPIRES_IN'),
    JWT_REFRESH_EXPIRES_IN: durationValue(config, 'JWT_REFRESH_EXPIRES_IN'),
    REFRESH_TOKEN_COOKIE: String(
      config['REFRESH_TOKEN_COOKIE'] ?? 'refresh_token'
    ),
    COOKIE_SECURE: cookieSecure,
    COOKIE_SAME_SITE: sameSite,
    DEFAULT_CURRENCY: String(config['DEFAULT_CURRENCY'] ?? 'EUR'),
    DEFAULT_TIMEZONE: String(config['DEFAULT_TIMEZONE'] ?? 'Europe/Rome'),
    DEFAULT_EXPENSE_REMINDER_TIME: reminderTimeValue(
      config['DEFAULT_EXPENSE_REMINDER_TIME']
    ),
    NOTIFICATION_SCHEDULER_CRON: schedulerCronValue(
      config['NOTIFICATION_SCHEDULER_CRON']
    ),
    NOTIFICATION_POLL_INTERVAL_MS: pollIntervalValue(
      config['NOTIFICATION_POLL_INTERVAL_MS']
    ),
    RECURRENCE_SCHEDULER_CRON: recurrenceCronValue(
      config['RECURRENCE_SCHEDULER_CRON'],
    ),
    DEFAULT_RECURRENCE_GENERATION_DAYS_AHEAD: defaultGenerationDays,
    MAX_RECURRENCE_GENERATION_DAYS_AHEAD: maximumGenerationDays,
    MAX_RECURRENCE_OCCURRENCES_PER_RUN: boundedInteger(
      config['MAX_RECURRENCE_OCCURRENCES_PER_RUN'],
      500,
      1,
      5000,
      'MAX_RECURRENCE_OCCURRENCES_PER_RUN',
    ),
  };
}
