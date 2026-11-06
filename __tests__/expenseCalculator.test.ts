import { Expense } from '@/types';
import {
  ExpenseDraft,
  getExpenseImpact,
  getRemainingAmount,
  splitEqually,
  sumShares,
  validateExpenseDraft,
} from '@/utils/expenseCalculator';

const MEMBERS = ['me', 'rahul', 'aman'];

describe('splitEqually', () => {
  it('splits ₹1,500 between 3 people as ₹500 each', () => {
    expect(splitEqually(1500, MEMBERS)).toEqual([
      { memberId: 'me', shareAmount: 500 },
      { memberId: 'rahul', shareAmount: 500 },
      { memberId: 'aman', shareAmount: 500 },
    ]);
  });

  it('distributes leftover paise so shares add up exactly', () => {
    const shares = splitEqually(100, MEMBERS);
    expect(shares.map((s) => s.shareAmount)).toEqual([33.34, 33.33, 33.33]);
    expect(sumShares(shares)).toBe(100);
  });

  it('handles awkward totals', () => {
    const cases: [number, number][] = [
      [1845.5, 3],
      [1199, 3],
      [0.01, 3],
      [999.99, 7],
      [10, 6],
    ];
    cases.forEach(([amount, people]) => {
      const ids = Array.from({ length: people }, (_, i) => `m${i}`);
      const shares = splitEqually(amount, ids);
      expect(sumShares(shares)).toBe(amount);
      const paise = shares.map((s) => Math.round(s.shareAmount * 100));
      expect(Math.max(...paise) - Math.min(...paise)).toBeLessThanOrEqual(1);
    });
  });

  it('returns no shares when there are no participants', () => {
    expect(splitEqually(500, [])).toEqual([]);
  });
});

describe('getRemainingAmount', () => {
  it('shows how much is left to assign', () => {
    const shares = [
      { memberId: 'me', shareAmount: 700 },
      { memberId: 'rahul', shareAmount: 500 },
    ];
    expect(getRemainingAmount(1500, shares)).toBe(300);
    expect(getRemainingAmount(1000, shares)).toBe(-200);
  });
});

describe('validateExpenseDraft', () => {
  const baseDraft: ExpenseDraft = {
    title: 'Dinner',
    amount: 1500,
    paidByMemberId: 'me',
    participantIds: MEMBERS,
    splitType: 'equal',
    customShares: {},
    groupMemberIds: MEMBERS,
  };

  it('accepts a valid equal split', () => {
    const result = validateExpenseDraft(baseDraft);
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(result.participants.map((p) => p.shareAmount)).toEqual([500, 500, 500]);
    }
  });

  it('accepts a valid unequal split (₹700 / ₹500 / ₹300)', () => {
    const result = validateExpenseDraft({
      ...baseDraft,
      splitType: 'unequal',
      customShares: { me: 700, rahul: 500, aman: 300 },
    });
    expect(result.isValid).toBe(true);
    if (result.isValid) {
      expect(sumShares(result.participants)).toBe(1500);
    }
  });

  it('rejects unequal splits that do not add up', () => {
    const result = validateExpenseDraft({
      ...baseDraft,
      splitType: 'unequal',
      customShares: { me: 700, rahul: 500, aman: 200 },
    });
    expect(result.isValid).toBe(false);
    if (!result.isValid) expect(result.errors.split).toBeDefined();
  });

  it('rejects missing or zero custom shares', () => {
    const result = validateExpenseDraft({
      ...baseDraft,
      splitType: 'unequal',
      customShares: { me: 1500, rahul: 0, aman: null },
    });
    expect(result.isValid).toBe(false);
  });

  it('rejects empty titles, zero amounts and no participants', () => {
    const result = validateExpenseDraft({ ...baseDraft, title: '  ', amount: 0, participantIds: [] });
    expect(result.isValid).toBe(false);
    if (!result.isValid) {
      expect(result.errors.title).toBeDefined();
      expect(result.errors.amount).toBeDefined();
      expect(result.errors.participants).toBeDefined();
    }
  });

  it('rejects a payer who is not in the group', () => {
    const result = validateExpenseDraft({ ...baseDraft, paidByMemberId: 'stranger' });
    expect(result.isValid).toBe(false);
  });
});

describe('getExpenseImpact', () => {
  const expense: Expense = {
    id: 'e1',
    groupId: 'g1',
    title: 'Dinner',
    amount: 1500,
    category: 'food',
    paidByMemberId: 'me',
    participants: splitEqually(1500, MEMBERS),
    splitType: 'equal',
    date: '2026-11-01T00:00:00.000Z',
    createdAt: '2026-11-01T00:00:00.000Z',
  };

  it('shows the payer lent the others their shares', () => {
    expect(getExpenseImpact(expense, 'me')).toBe(1000);
  });

  it('shows participants borrowed their share', () => {
    expect(getExpenseImpact(expense, 'rahul')).toBe(-500);
  });

  it('is zero for people not involved', () => {
    expect(getExpenseImpact(expense, 'neha')).toBe(0);
  });
});
