import { BadRequestException } from '@nestjs/common';
import { ReminderType } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  localDateTimeToUtc,
  scheduledAtForPreset,
} from '../src/notifications/notification-time.utils';

describe('notification time utilities', () => {
  it('converte Europe/Rome in UTC rispettando ora legale e solare', () => {
    expect(localDateTimeToUtc('2026-07-18', '09:00', 'Europe/Rome').toISOString())
      .toBe('2026-07-18T07:00:00.000Z');
    expect(localDateTimeToUtc('2026-01-18', '09:00', 'Europe/Rome').toISOString())
      .toBe('2026-01-18T08:00:00.000Z');
  });

  it('rifiuta un orario inesistente durante il cambio all’ora legale', () => {
    expect(() => localDateTimeToUtc('2026-03-29', '02:30', 'Europe/Rome'))
      .toThrow(BadRequestException);
  });

  it('calcola gli offset preset senza conversioni floating point', () => {
    const deadline = new Date('2026-07-18T07:00:00.000Z');
    expect(scheduledAtForPreset(ReminderType.THREE_DAYS_BEFORE, deadline).toISOString())
      .toBe('2026-07-15T07:00:00.000Z');
  });
});
