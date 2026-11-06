import { formatCurrency } from '@/utils/formatCurrency';
import { amountToInput, parseAmount, roundMoney, sanitizeAmountInput, toPaise } from '@/utils/money';

describe('money helpers', () => {
  it('converts rupees to paise without floating point drift', () => {
    expect(toPaise(0.29)).toBe(29);
    expect(toPaise(1845.5)).toBe(184550);
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
  });

  it('parses valid amount input', () => {
    expect(parseAmount('1500')).toBe(1500);
    expect(parseAmount('1,500.50')).toBe(1500.5);
    expect(parseAmount('₹ 249.9')).toBe(249.9);
    expect(parseAmount('12.')).toBe(12);
  });

  it('rejects invalid amount input', () => {
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('-50')).toBeNull();
    expect(parseAmount('1.234')).toBeNull();
    expect(parseAmount('1.2.3')).toBeNull();
  });

  it('sanitizes typed amounts', () => {
    expect(sanitizeAmountInput('12a3.456')).toBe('123.45');
    expect(sanitizeAmountInput('1.2.3')).toBe('1.23');
    expect(sanitizeAmountInput('₹500')).toBe('500');
  });

  it('formats amounts for inputs', () => {
    expect(amountToInput(500)).toBe('500');
    expect(amountToInput(333.3)).toBe('333.30');
  });
});

describe('formatCurrency', () => {
  it('uses Indian digit grouping and hides .00', () => {
    expect(formatCurrency(1500)).toBe('₹1,500');
    expect(formatCurrency(125000)).toBe('₹1,25,000');
    expect(formatCurrency(1845.5)).toBe('₹1,845.50');
    expect(formatCurrency(0)).toBe('₹0');
  });

  it('handles signs', () => {
    expect(formatCurrency(-250)).toBe('−₹250');
    expect(formatCurrency(2150, { showPlus: true })).toBe('+₹2,150');
    expect(formatCurrency(0, { showPlus: true })).toBe('₹0');
    expect(formatCurrency(-250, { absolute: true })).toBe('₹250');
  });
});
