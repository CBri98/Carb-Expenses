import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CreateCategoryDto } from '../src/categories/dto/category.dto';
import { CreateLabelDto } from '../src/labels/dto/label.dto';

describe('DTO catalogo', () => {
  it('rifiuta colori non esadecimali e icone non Bootstrap', async () => {
    const dto = plainToInstance(CreateCategoryDto, {
      name: 'Test',
      color: 'red',
      icon: 'house',
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(['color', 'icon']),
    );
  });

  it('accetta una etichetta valida senza icona e categoria', async () => {
    const dto = plainToInstance(CreateLabelDto, {
      name: 'Spese condivise',
      color: '#4F46E5',
      isActive: false,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
