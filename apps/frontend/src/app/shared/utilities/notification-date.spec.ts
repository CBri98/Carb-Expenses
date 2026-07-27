import { describe, expect, it } from 'vitest';

import {
  isoToRomeLocalInput,
  notificationRelativeTime,
  romeLocalDateTimeToIso,
} from './notification-date';

describe('notification date utilities', () => {
  it('converte date locali di Roma rispettando DST', () => {
    expect(romeLocalDateTimeToIso('2026-07-18T09:00')).toBe('2026-07-18T07:00:00.000Z');
    expect(romeLocalDateTimeToIso('2026-01-18T09:00')).toBe('2026-01-18T08:00:00.000Z');
    expect(isoToRomeLocalInput('2026-07-18T07:00:00.000Z')).toBe('2026-07-18T09:00');
  });

  it('formatta il tempo relativo in italiano', () => {
    expect(notificationRelativeTime('2026-07-18T09:59:00.000Z', new Date('2026-07-18T10:00:00Z').getTime())).toContain('minuto');
  });
});
