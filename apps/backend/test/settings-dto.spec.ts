import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import {
  UpdateAppearancePreferencesDto,
  UpdateExperiencePreferencesDto,
  UpdateIconPreferencesDto,
} from '../src/settings/dto/settings.dto';

describe('Settings DTO', () => {
  it('rifiuta colori arbitrari e stato CANCELLED come default', async () => {
    const appearance = await validate(plainToInstance(UpdateAppearancePreferencesDto, {
      accentColor: '#ffffff',
    }));
    const experience = await validate(plainToInstance(UpdateExperiencePreferencesDto, {
      defaultExpenseStatus: 'CANCELLED', defaultPageSize: 500,
    }));
    expect(appearance).toHaveLength(1);
    expect(experience.map((error) => error.property)).toEqual(
      expect.arrayContaining(['defaultExpenseStatus', 'defaultPageSize']),
    );
  });

  it('rifiuta classi icona arbitrarie, duplicati e cataloghi vuoti', async () => {
    const errors = await validate(plainToInstance(UpdateIconPreferencesDto, {
      enabledCategoryIcons: ['bi-house', 'bi-house', 'bi-non-esiste'],
      enabledLabelIcons: ['bi-tag text-danger', '<svg>'],
    }));
    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['enabledCategoryIcons', 'enabledLabelIcons']),
    );
    const empty = await validate(plainToInstance(UpdateIconPreferencesDto, {
      enabledCategoryIcons: [], enabledLabelIcons: [],
    }));
    expect(empty).toHaveLength(2);
  });
});
