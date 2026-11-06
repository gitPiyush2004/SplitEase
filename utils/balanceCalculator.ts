import {
  BalanceMap,
  CURRENT_USER_ID,
  Expense,
  Group,
  Member,
  Settlement,
  SettlementSuggestion,
} from '@/types';

import { fromPaise, toPaise } from './money';

/**
 * Balance rules
 * -------------
 * Expense:    the payer is credited the full amount, and every participant
 *             is debited their share.
 * Settlement: the person who paid is credited, the person who received
 *             the money is debited.
 *
 * Positive balance = the member is owed money.
 * Negative balance = the member owes money.
 * Inside a group, all balances always add up to exactly zero.
 */

/** Same as calculateGroupBalances but in integer paise (used internally). */
function calculateGroupBalancesInPaise(
  group: Group,
  expenses: Expense[],
  settlements: Settlement[],
): Record<string, number> {
  const balances: Record<string, number> = {};
  group.members.forEach((member) => {
    balances[member.id] = 0;
  });

  const add = (memberId: string, paise: number) => {
    balances[memberId] = (balances[memberId] ?? 0) + paise;
  };

  expenses
    .filter((expense) => expense.groupId === group.id)
    .forEach((expense) => {
      add(expense.paidByMemberId, toPaise(expense.amount));
      expense.participants.forEach((participant) => {
        add(participant.memberId, -toPaise(participant.shareAmount));
      });
    });

  settlements
    .filter((settlement) => settlement.groupId === group.id)
    .forEach((settlement) => {
      add(settlement.fromMemberId, toPaise(settlement.amount));
      add(settlement.toMemberId, -toPaise(settlement.amount));
    });

  return balances;
}

/** Every member's net balance (in rupees) within one group. */
export function calculateGroupBalances(
  group: Group,
  expenses: Expense[],
  settlements: Settlement[],
): BalanceMap {
  const paiseBalances = calculateGroupBalancesInPaise(group, expenses, settlements);
  const balances: BalanceMap = {};
  Object.entries(paiseBalances).forEach(([memberId, paise]) => {
    balances[memberId] = fromPaise(paise);
  });
  return balances;
}

/** Total amount spent in a group (settlements are not spending). */
export function getGroupTotalExpenses(groupId: string, expenses: Expense[]): number {
  const totalPaise = expenses
    .filter((expense) => expense.groupId === groupId)
    .reduce((sum, expense) => sum + toPaise(expense.amount), 0);
  return fromPaise(totalPaise);
}

/** The current user's net balance in one group. */
export function getUserGroupBalance(
  group: Group,
  expenses: Expense[],
  settlements: Settlement[],
  userId: string = CURRENT_USER_ID,
): number {
  return calculateGroupBalances(group, expenses, settlements)[userId] ?? 0;
}

/** The user's balance in each group, in paise (shared by the totals below). */
function getUserBalancesPerGroupInPaise(
  groups: Group[],
  expenses: Expense[],
  settlements: Settlement[],
  userId: string,
): number[] {
  return groups.map(
    (group) => calculateGroupBalancesInPaise(group, expenses, settlements)[userId] ?? 0,
  );
}

/** Sum of what the user owes across all groups where their balance is negative. */
export function calculateTotalUserOwes(
  groups: Group[],
  expenses: Expense[],
  settlements: Settlement[],
  userId: string = CURRENT_USER_ID,
): number {
  const owedPaise = getUserBalancesPerGroupInPaise(groups, expenses, settlements, userId)
    .filter((paise) => paise < 0)
    .reduce((sum, paise) => sum - paise, 0);
  return fromPaise(owedPaise);
}

/** Sum of what others owe the user across all groups where their balance is positive. */
export function calculateTotalOwedToUser(
  groups: Group[],
  expenses: Expense[],
  settlements: Settlement[],
  userId: string = CURRENT_USER_ID,
): number {
  const owedPaise = getUserBalancesPerGroupInPaise(groups, expenses, settlements, userId)
    .filter((paise) => paise > 0)
    .reduce((sum, paise) => sum + paise, 0);
  return fromPaise(owedPaise);
}

/** The user's overall net balance: (owed to you) − (you owe). */
export function calculateUserNetBalance(
  groups: Group[],
  expenses: Expense[],
  settlements: Settlement[],
  userId: string = CURRENT_USER_ID,
): number {
  const netPaise = getUserBalancesPerGroupInPaise(groups, expenses, settlements, userId).reduce(
    (sum, paise) => sum + paise,
    0,
  );
  return fromPaise(netPaise);
}

export interface BalanceSummary {
  youOwe: number;
  youAreOwed: number;
  net: number;
}

/** Everything the dashboard balance card needs. */
export function calculateUserBalanceSummary(
  groups: Group[],
  expenses: Expense[],
  settlements: Settlement[],
  userId: string = CURRENT_USER_ID,
): BalanceSummary {
  return {
    youOwe: calculateTotalUserOwes(groups, expenses, settlements, userId),
    youAreOwed: calculateTotalOwedToUser(groups, expenses, settlements, userId),
    net: calculateUserNetBalance(groups, expenses, settlements, userId),
  };
}

/**
 * Suggests a small set of payments that would settle everyone up.
 *
 * Greedy approach:
 * 1. Split members into debtors (negative balance) and creditors (positive).
 * 2. Sort both lists so the biggest amounts come first.
 * 3. The biggest debtor pays the biggest creditor as much as possible
 *    (the smaller of the two amounts).
 * 4. Whoever reaches zero is removed; repeat until no one is left.
 *
 * Each step fully settles at least one person, so a group of N people
 * needs at most N − 1 payments.
 *
 * These are only suggestions — nothing is recorded until the user
 * confirms a settlement on the Settle Up screen.
 */
export function generateSettlementSuggestions(balances: BalanceMap): SettlementSuggestion[] {
  const debtors: { memberId: string; paise: number }[] = [];
  const creditors: { memberId: string; paise: number }[] = [];

  Object.entries(balances).forEach(([memberId, rupees]) => {
    const paise = toPaise(rupees);
    if (paise < 0) debtors.push({ memberId, paise: -paise });
    if (paise > 0) creditors.push({ memberId, paise });
  });

  debtors.sort((a, b) => b.paise - a.paise);
  creditors.sort((a, b) => b.paise - a.paise);

  const suggestions: SettlementSuggestion[] = [];
  let d = 0;
  let c = 0;

  while (d < debtors.length && c < creditors.length) {
    const debtor = debtors[d];
    const creditor = creditors[c];
    const payment = Math.min(debtor.paise, creditor.paise);

    suggestions.push({
      fromMemberId: debtor.memberId,
      toMemberId: creditor.memberId,
      amount: fromPaise(payment),
    });

    debtor.paise -= payment;
    creditor.paise -= payment;
    if (debtor.paise === 0) d += 1;
    if (creditor.paise === 0) c += 1;
  }

  return suggestions;
}

export interface MemberRelation {
  member: Member;
  /** Positive: this member owes the user. Negative: the user owes them. Zero: settled. */
  amount: number;
}

/**
 * For each other member in the group, how much they owe the user (or the
 * user owes them) according to the suggested settlements.
 * Powers lines like "Rahul owes you ₹500" or "You owe Aman ₹300".
 */
export function getUserRelations(
  group: Group,
  suggestions: SettlementSuggestion[],
  userId: string = CURRENT_USER_ID,
): MemberRelation[] {
  return group.members
    .filter((member) => member.id !== userId)
    .map((member) => {
      const paise = suggestions.reduce((sum, s) => {
        if (s.fromMemberId === member.id && s.toMemberId === userId) return sum + toPaise(s.amount);
        if (s.fromMemberId === userId && s.toMemberId === member.id) return sum - toPaise(s.amount);
        return sum;
      }, 0);
      return { member, amount: fromPaise(paise) };
    });
}

/**
 * The most `fromMemberId` can pay `toMemberId` without anyone's balance
 * flipping sign: the payer can't pay more than they owe, and the receiver
 * can't receive more than they are owed.
 */
export function getMaxSettlementAmount(
  balances: BalanceMap,
  fromMemberId: string,
  toMemberId: string,
): number {
  const fromOwesPaise = -toPaise(balances[fromMemberId] ?? 0);
  const toIsOwedPaise = toPaise(balances[toMemberId] ?? 0);
  return fromPaise(Math.max(0, Math.min(fromOwesPaise, toIsOwedPaise)));
}

export interface SettlementInput {
  fromMemberId: string;
  toMemberId: string;
  amount: number | null;
}

/** Returns an error message, or null when the settlement is valid. */
export function validateSettlement(
  group: Group,
  balances: BalanceMap,
  input: SettlementInput,
): string | null {
  const memberIds = group.members.map((m) => m.id);
  if (!memberIds.includes(input.fromMemberId) || !memberIds.includes(input.toMemberId)) {
    return 'Choose who paid and who received the money.';
  }
  if (input.fromMemberId === input.toMemberId) {
    return 'The payer and receiver must be different people.';
  }
  if (input.amount === null || input.amount <= 0) {
    return 'Enter an amount greater than ₹0.';
  }
  const maxAmount = getMaxSettlementAmount(balances, input.fromMemberId, input.toMemberId);
  if (maxAmount === 0) {
    return 'There is no outstanding debt in this direction.';
  }
  if (toPaise(input.amount) > toPaise(maxAmount)) {
    return 'Amount is more than what is outstanding.';
  }
  return null;
}
