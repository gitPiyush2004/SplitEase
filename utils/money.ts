/**
 * Money helpers.
 *
 * JavaScript numbers are floating point, so 0.1 + 0.2 !== 0.3.
 * To keep every calculation exact we convert rupees to integer paise
 * (1 rupee = 100 paise), do the maths on integers, and convert back.
 */

export function toPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function fromPaise(paise: number): number {
  return paise / 100;
}

/** Rounds a rupee value to exactly two decimal places. */
export function roundMoney(rupees: number): number {
  return fromPaise(toPaise(rupees));
}

/**
 * Parses user input such as "1,500" or "249.5" into a rupee amount.
 * Returns null when the input is empty or not a valid amount.
 */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) {
    return null;
  }
  const value = Number(cleaned);
  return Number.isFinite(value) ? roundMoney(value) : null;
}

/**
 * Cleans text typed into an amount field: digits and a single decimal
 * point only, with at most two digits after the point.
 */
export function sanitizeAmountInput(text: string): string {
  const digitsAndDots = text.replace(/[^0-9.]/g, '');
  const [whole, ...rest] = digitsAndDots.split('.');
  if (rest.length === 0) {
    return whole;
  }
  return `${whole}.${rest.join('').slice(0, 2)}`;
}

/** Formats a number for an editable input: 500 → "500", 333.3 → "333.30". */
export function amountToInput(rupees: number): string {
  return toPaise(rupees) % 100 === 0 ? String(Math.round(rupees)) : rupees.toFixed(2);
}
