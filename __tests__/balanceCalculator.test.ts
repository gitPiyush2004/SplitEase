import { Expense, Group, Settlement } from '@/types';
import {
  calculateGroupBalances,
  calculateUserBalanceSummary,
  generateSettlementSuggestions,
  getGroupTotalExpenses,
  getMaxSettlementAmount,
  getUserRelations,
  validateSettlement,
} from '@/utils/balanceCalculator';
import { splitEqually } from '@/utils/expenseCalculator';
import { toPaise } from '@/utils/money';

const DATE = '2026-11-01T10:00:00.000Z';

const goa: Group = {
  id: 'goa',
  name: 'Goa Trip',
  description: '',
  category: 'trip',
  members: [
    { id: 'me', name: 'Piyush' },
    { id: 'rahul', name: 'Rahul' },
    { id: 'aman', name: 'Aman' },
  ],
  createdAt: DATE,
};

function expense(id: string, amount: number, paidBy: string, groupId = 'goa'): Expense {
  return {
    id,
    groupId,
    title: id,
    amount,
    category: 'other',
    paidByMemberId: paidBy,
    participants: splitEqually(amount, ['me', 'rahul', 'aman']),
    splitType: 'equal',
    date: DATE,
    createdAt: DATE,
  };
}

function settlement(from: string, to: string, amount: number, groupId = 'goa'): Settlement {
  return { id: `${from}-${to}`, groupId, fromMemberId: from, toMemberId: to, amount, date: DATE, createdAt: DATE };
}

function sumBalances(balances: Record<string, number>): number {
  return Object.values(balances).reduce((sum, value) => sum + toPaise(value), 0);
}

// Dinner ₹1,500 paid by Piyush + Cab ₹900 paid by Rahul, both split 3 ways.
const dinner = expense('dinner', 1500, 'me');
const cab = expense('cab', 900, 'rahul');

describe('calculateGroupBalances', () => {
  it('credits the payer and debits each participant', () => {
    expect(calculateGroupBalances(goa, [dinner], [])).toEqual({ me: 1000, rahul: -500, aman: -500 });
  });

  it('combines multiple expenses (Goa example)', () => {
    // Piyush: paid 1500, share 500 + 300 → +700
    // Rahul:  paid 900,  share 500 + 300 → +100
    // Aman:   paid 0,    share 500 + 300 → −800
    expect(calculateGroupBalances(goa, [dinner, cab], [])).toEqual({ me: 700, rahul: 100, aman: -800 });
  });

  it('always sums to zero', () => {
    const odd = { ...expense('odd', 1000, 'aman'), participants: splitEqually(1000, ['me', 'rahul', 'aman']) };
    const balances = calculateGroupBalances(goa, [dinner, cab, odd], [settlement('aman', 'me', 123.45)]);
    expect(sumBalances(balances)).toBe(0);
  });

  it('applies settlements: payer goes up, receiver goes down', () => {
    const balances = calculateGroupBalances(goa, [dinner, cab], [settlement('aman', 'me', 700)]);
    expect(balances).toEqual({ me: 0, rahul: 100, aman: -100 });
  });

  it('ignores expenses and settlements from other groups', () => {
    const balances = calculateGroupBalances(goa, [dinner, expense('x', 3000, 'me', 'other')], [settlement('aman', 'me', 50, 'other')]);
    expect(balances).toEqual({ me: 1000, rahul: -500, aman: -500 });
  });

  it('recalculates correctly after an expense is deleted', () => {
    const before = calculateGroupBalances(goa, [dinner, cab], []);
    const after = calculateGroupBalances(goa, [dinner, cab].filter((e) => e.id !== 'cab'), []);
    expect(before.rahul).toBe(100);
    expect(after).toEqual({ me: 1000, rahul: -500, aman: -500 });
  });

  it('gives every member a zero balance in an empty group', () => {
    expect(calculateGroupBalances(goa, [], [])).toEqual({ me: 0, rahul: 0, aman: 0 });
  });
});

describe('getGroupTotalExpenses', () => {
  it('adds up expenses but not settlements', () => {
    expect(getGroupTotalExpenses('goa', [dinner, cab, expense('x', 10, 'me', 'other')])).toBe(2400);
  });
});

describe('generateSettlementSuggestions', () => {
  it('matches debtors with creditors', () => {
    expect(generateSettlementSuggestions({ me: 700, rahul: 100, aman: -800 })).toEqual([
      { fromMemberId: 'aman', toMemberId: 'me', amount: 700 },
      { fromMemberId: 'aman', toMemberId: 'rahul', amount: 100 },
    ]);
  });

  it('uses at most N − 1 payments and settles everyone', () => {
    const balances = { a: 50.5, b: -20.25, c: -30.25, d: 40, e: -40 };
    const suggestions = generateSettlementSuggestions(balances);
    expect(suggestions.length).toBeLessThanOrEqual(4);

    const remaining: Record<string, number> = {};
    Object.entries(balances).forEach(([id, value]) => (remaining[id] = toPaise(value)));
    suggestions.forEach((s) => {
      remaining[s.fromMemberId] += toPaise(s.amount);
      remaining[s.toMemberId] -= toPaise(s.amount);
    });
    Object.values(remaining).forEach((value) => expect(value).toBe(0));
  });

  it('returns nothing when everyone is settled', () => {
    expect(generateSettlementSuggestions({ me: 0, rahul: 0 })).toEqual([]);
  });
});

describe('getUserRelations', () => {
  it('describes who owes the user and who the user owes', () => {
    const suggestions = generateSettlementSuggestions({ me: -300, rahul: 500, aman: -200 });
    const relations = getUserRelations(goa, suggestions);
    expect(relations.map((r) => [r.member.id, r.amount])).toEqual([
      ['rahul', -300], // you owe Rahul ₹300
      ['aman', 0], // settled with Aman
    ]);
  });
});

describe('settlement validation', () => {
  const balances = calculateGroupBalances(goa, [dinner, cab], []); // me 700, rahul 100, aman −800

  it('caps the amount at what is outstanding in that direction', () => {
    expect(getMaxSettlementAmount(balances, 'aman', 'me')).toBe(700);
    expect(getMaxSettlementAmount(balances, 'aman', 'rahul')).toBe(100);
    expect(getMaxSettlementAmount(balances, 'me', 'aman')).toBe(0);
  });

  it('accepts a valid settlement', () => {
    expect(validateSettlement(goa, balances, { fromMemberId: 'aman', toMemberId: 'me', amount: 700 })).toBeNull();
  });

  it('rejects invalid settlements', () => {
    expect(validateSettlement(goa, balances, { fromMemberId: 'aman', toMemberId: 'aman', amount: 10 })).not.toBeNull();
    expect(validateSettlement(goa, balances, { fromMemberId: 'aman', toMemberId: 'me', amount: 0 })).not.toBeNull();
    expect(validateSettlement(goa, balances, { fromMemberId: 'aman', toMemberId: 'me', amount: 700.01 })).not.toBeNull();
    expect(validateSettlement(goa, balances, { fromMemberId: 'me', toMemberId: 'aman', amount: 10 })).not.toBeNull();
    expect(validateSettlement(goa, balances, { fromMemberId: 'ghost', toMemberId: 'me', amount: 10 })).not.toBeNull();
  });
});

describe('calculateUserBalanceSummary', () => {
  const flat: Group = { ...goa, id: 'flat', name: 'Flat' };

  it('sums positive and negative group balances separately', () => {
    // Goa: me +700. Flat: Rahul paid ₹900 → me −300.
    const summary = calculateUserBalanceSummary([goa, flat], [dinner, cab, expense('rent', 900, 'rahul', 'flat')], []);
    expect(summary).toEqual({ youOwe: 300, youAreOwed: 700, net: 400 });
  });
});
