import { toPaise } from './money';

const CURRENCY_SYMBOL = '₹';

const formatterCache = new Map<number, Intl.NumberFormat>();

function getFormatter(fractionDigits: number): Intl.NumberFormat | null {
  if (typeof Intl === 'undefined' || typeof Intl.NumberFormat !== 'function') {
    return null;
  }
  let formatter = formatterCache.get(fractionDigits);
  if (!formatter) {
    try {
      // en-IN gives Indian digit grouping: 1,00,000 instead of 100,000
      formatter = new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      });
      formatterCache.set(fractionDigits, formatter);
    } catch {
      return null;
    }
  }
  return formatter;
}

/** Fallback for engines without Intl: groups digits the Indian way (12,34,567). */
function formatIndianNumber(value: number, fractionDigits: number): string {
  const [whole, fraction] = value.toFixed(fractionDigits).split('.');
  const lastThree = whole.slice(-3);
  const rest = whole.slice(0, -3);
  const grouped = rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${lastThree}` : lastThree;
  return fraction ? `${grouped}.${fraction}` : grouped;
}

interface FormatOptions {
  /** Prefix positive values with "+" (negative values always get "−"). */
  showPlus?: boolean;
  /** Ignore the sign and format the absolute value. */
  absolute?: boolean;
}

/**
 * Formats a rupee amount for display.
 *   formatCurrency(1500)                      → "₹1,500"
 *   formatCurrency(1845.5)                    → "₹1,845.50"
 *   formatCurrency(-250)                      → "−₹250"
 *   formatCurrency(2150, { showPlus: true })  → "+₹2,150"
 */
export function formatCurrency(amount: number, options: FormatOptions = {}): string {
  const paise = toPaise(amount);
  const absoluteValue = Math.abs(paise) / 100;
  const fractionDigits = paise % 100 === 0 ? 0 : 2;

  const formatter = getFormatter(fractionDigits);
  const number = formatter
    ? formatter.format(absoluteValue)
    : formatIndianNumber(absoluteValue, fractionDigits);

  let sign = '';
  if (!options.absolute) {
    if (paise < 0) sign = '−';
    else if (paise > 0 && options.showPlus) sign = '+';
  }
  return `${sign}${CURRENCY_SYMBOL}${number}`;
}
