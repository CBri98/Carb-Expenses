import { ExpenseStatus, PaymentMethod } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';

import { CreateExpenseDto, ExpenseQueryDto } from '../src/expenses/dto/expense.dto';

const valid = {
  description: 'Spesa supermercato', amount: '86.45', expenseDate: '2026-07-14',
  categoryId: '10000000-0000-4000-8000-000000000001',
  paymentMethod: PaymentMethod.DEBIT_CARD, status: ExpenseStatus.COMPLETED,
};

describe('DTO spese', () => {
  it.each(['0', '0.00', '-2.00', '1.234', '10000000000.00', 'abc'])(
    'rifiuta l’importo non valido %s',
    async (amount) => {
      const errors = await validate(plainToInstance(CreateExpenseDto, { ...valid, amount }));
      expect(errors.some((error) => error.property === 'amount')).toBe(true);
    },
  );

  it('normalizza la virgola decimale e accetta etichette univoche', async () => {
    const dto = plainToInstance(CreateExpenseDto, {
      ...valid,
      amount: '12,50',
      labelIds: ['20000000-0000-4000-8000-000000000001'],
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.amount).toBe('12.50');
  });

  it('rifiuta etichette duplicate', async () => {
    const id = '20000000-0000-4000-8000-000000000001';
    const errors = await validate(plainToInstance(CreateExpenseDto, {
      ...valid, labelIds: [id, id],
    }));
    expect(errors.some((error) => error.property === 'labelIds')).toBe(true);
  });

  it('trasforma il filtro booleano delle spese future e rifiuta valori ambigui', async () => {
    const dto = plainToInstance(ExpenseQueryDto, { includeFuture: 'false' });
    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.includeFuture).toBe(false);

    const errors = await validate(plainToInstance(ExpenseQueryDto, { includeFuture: 'non-valido' }));
    expect(errors.some((error) => error.property === 'includeFuture')).toBe(true);
  });

  it('trasforma paginazione e filtro etichette dalla query', async () => {
    const dto = plainToInstance(ExpenseQueryDto, {
      page: '2', pageSize: '50', month: '7', year: '2026',
      labelIds: '20000000-0000-4000-8000-000000000001,20000000-0000-4000-8000-000000000002',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({ page: 2, pageSize: 50, month: 7, year: 2026 });
    expect(dto.labelIds).toHaveLength(2);
  });

  it('trasforma e valida i filtri multipli e la modalità ricorrenza', async () => {
    const dto = plainToInstance(ExpenseQueryDto, {
      categoryIds: '10000000-0000-4000-8000-000000000001,10000000-0000-4000-8000-000000000002',
      statuses: 'COMPLETED,PLANNED',
      paymentMethods: 'CASH,DEBIT_CARD',
      recurrenceMode: 'EXCLUDE',
    });
    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.categoryIds).toHaveLength(2);
    expect(dto.statuses).toEqual([ExpenseStatus.COMPLETED, ExpenseStatus.PLANNED]);
    expect(dto.paymentMethods).toEqual([PaymentMethod.CASH, PaymentMethod.DEBIT_CARD]);
    expect(dto.recurrenceMode).toBe('EXCLUDE');

    const errors = await validate(plainToInstance(ExpenseQueryDto, {
      statuses: 'COMPLETED,INVALID', recurrenceMode: 'SOMETIMES',
    }));
    expect(errors.map((error) => error.property)).toEqual(expect.arrayContaining([
      'statuses', 'recurrenceMode',
    ]));
  });
});
