import { calculateGroupBalances, calculateUserBalanceSummary } from '@/utils/balanceCalculator';
import { sumShares } from '@/utils/expenseCalculator';
import { toPaise } from '@/utils/money';
import { createSeedData } from '@/utils/seedData';

describe('demo data', () => {
  const data = createSeedData(new Date('2026-11-06T12:00:00'));

  it('has three groups', () => {
    expect(data.groups.map((g) => g.name)).toEqual(['Goa Trip', 'Flatmates', 'Weekend Plans']);
  });

  it('has shares that add up to each expense amount', () => {
    data.expenses.forEach((expense) => {
      expect(sumShares(expense.participants)).toBe(expense.amount);
    });
  });

  it('only references real group members', () => {
    data.expenses.forEach((expense) => {
      const group = data.groups.find((g) => g.id === expense.groupId)!;
      const ids = group.members.map((m) => m.id);
      expect(ids).toContain(expense.paidByMemberId);
      expense.participants.forEach((p) => expect(ids).toContain(p.memberId));
    });
  });

  it('produces balances that sum to zero in every group', () => {
    data.groups.forEach((group) => {
      const balances = calculateGroupBalances(group, data.expenses, data.settlements);
      const total = Object.values(balances).reduce((sum, value) => sum + toPaise(value), 0);
      expect(total).toBe(0);
    });
  });

  it('matches the documented balances', () => {
    const [goa, flat, weekend] = data.groups;
    expect(calculateGroupBalances(goa, data.expenses, data.settlements)).toEqual({
      me: 3100,
      mem_goa_rahul: -1200,
      mem_goa_aman: -1900,
    });
    expect(calculateGroupBalances(flat, data.expenses, data.settlements)).toEqual({
      me: 1460.66,
      mem_flat_neha: -414.84,
      mem_flat_karan: -1045.82,
    });
    expect(calculateGroupBalances(weekend, data.expenses, data.settlements)).toEqual({
      me: -1470,
      mem_wk_sneha: -610,
      mem_wk_arjun: 2970,
      mem_wk_ishaan: -890,
    });
  });

  it('gives a sensible dashboard summary', () => {
    expect(calculateUserBalanceSummary(data.groups, data.expenses, data.settlements)).toEqual({
      youOwe: 1470,
      youAreOwed: 4560.66,
      net: 3090.66,
    });
  });
});
