const ROME_TIMEZONE = 'Europe/Rome';

export function romeLocalDateTimeToIso(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return '';
  const desired = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  };
  const expected = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
  );
  let candidate = expected;
  for (let iteration = 0; iteration < 4; iteration += 1) {
    const actual = romeParts(new Date(candidate));
    candidate += expected - Date.UTC(
      actual.year,
      actual.month - 1,
      actual.day,
      actual.hour,
      actual.minute,
    );
  }
  return new Date(candidate).toISOString();
}

export function isoToRomeLocalInput(value: string): string {
  const parts = romeParts(new Date(value));
  return `${parts.year}-${two(parts.month)}-${two(parts.day)}T${two(parts.hour)}:${two(parts.minute)}`;
}

export function nowRomeLocalInput(): string {
  return isoToRomeLocalInput(new Date().toISOString());
}

export function notificationRelativeTime(value: string, now = Date.now()): string {
  const differenceMinutes = Math.round((new Date(value).getTime() - now) / 60_000);
  const formatter = new Intl.RelativeTimeFormat('it-IT', { numeric: 'auto' });
  if (Math.abs(differenceMinutes) < 60) return formatter.format(differenceMinutes, 'minute');
  const hours = Math.round(differenceMinutes / 60);
  if (Math.abs(hours) < 24) return formatter.format(hours, 'hour');
  return formatter.format(Math.round(hours / 24), 'day');
}

function romeParts(value: Date): LocalParts {
  const values = new Map(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: ROME_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(value)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
  return {
    year: values.get('year') ?? 0,
    month: values.get('month') ?? 0,
    day: values.get('day') ?? 0,
    hour: values.get('hour') ?? 0,
    minute: values.get('minute') ?? 0,
  };
}

interface LocalParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function two(value: number): string {
  return String(value).padStart(2, '0');
}
