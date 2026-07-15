import { describe, expect, it } from 'vitest';
import {
  expenseStatusLabel,
  formatEuroAmount,
  formatItalianDate,
  isFutureLocalDate,
  normalizeAmount,
  paymentMethodLabel,
} from './expense-format';

describe('formattazione spese', () => {
  it('formatta importi senza calcoli floating point', () => {
    expect(formatEuroAmount('1250.50')).toBe('1.250,50 €');
    expect(normalizeAmount(' 12,5 ')).toBe('12.5');
  });

  it('formatta date locali senza conversioni di fuso', () => {
    expect(formatItalianDate('2026-07-14')).toBe('14/07/2026');
    expect(isFutureLocalDate('2026-07-15', '2026-07-14')).toBe(true);
  });

  it('traduce enum stabili', () => {
    expect(expenseStatusLabel('PLANNED')).toBe('Pianificata');
    expect(paymentMethodLabel('DEBIT_CARD')).toBe('Carta di debito');
  });
});
