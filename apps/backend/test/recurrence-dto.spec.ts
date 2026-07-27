import { PaymentMethod, RecurrenceFrequency, ReminderType } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CreateRecurrenceDto } from '../src/recurrences/dto/recurrence.dto';

const categoryId = '10000000-0000-4000-8000-000000000001';

describe('CreateRecurrenceDto', () => {
  it('accetta una ricorrenza completa valida', async () => {
    const dto = plainToInstance(CreateRecurrenceDto, {
      name: ' Affitto  casa ',
      description: 'Affitto mensile',
      amount: '850,00',
      categoryId,
      paymentMethod: PaymentMethod.BANK_TRANSFER,
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      startDate: '2026-08-01',
      maxOccurrences: 36,
      generateDaysAhead: 60,
      reminderTemplates: [
        { type: ReminderType.THREE_DAYS_BEFORE, reminderTime: '09:00' },
      ],
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.name).toBe('Affitto casa');
    expect(dto.amount).toBe('850.00');
  });

  it.each([
    [{ amount: '0.00' }, 'importo zero'],
    [{ interval: 0 }, 'intervallo zero'],
    [{ startDate: '2026-02-31' }, 'data semanticamente verificata dal service'],
    [{ generateDaysAhead: 0 }, 'orizzonte zero'],
  ])('rifiuta %s (%s) quando previsto dal DTO', async (override, description) => {
    const dto = plainToInstance(CreateRecurrenceDto, {
      name: 'Test',
      description: 'Test',
      amount: '10.00',
      categoryId,
      paymentMethod: PaymentMethod.CASH,
      frequency: RecurrenceFrequency.DAILY,
      interval: 1,
      startDate: '2026-08-01',
      generateDaysAhead: 30,
      ...override,
    });
    const errors = await validate(dto);
    if (description.includes('semanticamente')) {
      expect(errors).toHaveLength(0);
    } else {
      expect(errors.length).toBeGreaterThan(0);
    }
  });

  it('rifiuta template duplicati', async () => {
    const dto = plainToInstance(CreateRecurrenceDto, {
      name: 'Test',
      description: 'Test',
      amount: '10.00',
      categoryId,
      paymentMethod: PaymentMethod.CASH,
      frequency: RecurrenceFrequency.MONTHLY,
      interval: 1,
      startDate: '2026-08-01',
      reminderTemplates: [
        { type: ReminderType.SAME_DAY },
        { type: ReminderType.SAME_DAY },
      ],
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
});
