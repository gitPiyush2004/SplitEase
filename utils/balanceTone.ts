import { colors } from '@/constants/theme';

import { toPaise } from './money';

export interface BalanceTone {
  color: string;
  background: string;
  /** e.g. "you're owed", "you owe", "settled up" */
  label: string;
}

/** Colour and wording for the current user's balance. */
export function getBalanceTone(amount: number): BalanceTone {
  const paise = toPaise(amount);
  if (paise > 0) return { color: colors.positive, background: colors.positiveSoft, label: 'you’re owed' };
  if (paise < 0) return { color: colors.negative, background: colors.negativeSoft, label: 'you owe' };
  return { color: colors.textSecondary, background: colors.divider, label: 'settled up' };
}
