import {
  AppData,
  CURRENT_USER_ID,
  Expense,
  ExpenseCategory,
  ExpenseParticipant,
  Group,
  Settlement,
} from '@/types';

import { addDays } from './date';
import { splitEqually } from './expenseCalculator';

/**
 * Demo data shown on first launch.
 *
 * Dates are relative to "now" so the app always looks recently used.
 * Every expense is built with the same split helpers the app uses, so
 * balances are mathematically consistent (see __tests__/seedData.test.ts).
 *
 * Resulting balances:
 *   Goa Trip       You +₹3,100      Rahul −₹1,200     Aman −₹1,900
 *   Flatmates      You +₹1,460.66   Neha −₹414.84     Karan −₹1,045.82
 *   Weekend Plans  You −₹1,470      Sneha −₹610       Arjun +₹2,970   Ishaan −₹890
 */

export const DEFAULT_PROFILE = {
  name: 'Piyush Bhatia',
  email: 'piyush@example.com',
};

function at(now: Date, daysAgo: number, hour: number, minute = 0): string {
  const date = addDays(now, -daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

interface SeedExpenseInput {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidBy: string;
  date: string;
}

function equalExpense(input: SeedExpenseInput, participantIds: string[]): Expense {
  return {
    id: input.id,
    groupId: input.groupId,
    title: input.title,
    amount: input.amount,
    category: input.category,
    paidByMemberId: input.paidBy,
    participants: splitEqually(input.amount, participantIds),
    splitType: 'equal',
    date: input.date,
    createdAt: input.date,
  };
}

function unequalExpense(input: SeedExpenseInput, participants: ExpenseParticipant[]): Expense {
  return {
    id: input.id,
    groupId: input.groupId,
    title: input.title,
    amount: input.amount,
    category: input.category,
    paidByMemberId: input.paidBy,
    participants,
    splitType: 'unequal',
    date: input.date,
    createdAt: input.date,
  };
}

export function createSeedData(now: Date = new Date()): AppData {
  const me = { id: CURRENT_USER_ID, name: DEFAULT_PROFILE.name, email: DEFAULT_PROFILE.email };

  const goa: Group = {
    id: 'grp_goa',
    name: 'Goa Trip',
    description: 'Beaches, sunsets and too much seafood',
    category: 'trip',
    members: [
      me,
      { id: 'mem_goa_rahul', name: 'Rahul Sharma', email: 'rahul@example.com' },
      { id: 'mem_goa_aman', name: 'Aman Verma' },
    ],
    createdAt: at(now, 7, 10),
  };

  const flat: Group = {
    id: 'grp_flat',
    name: 'Flatmates',
    description: 'Flat 402, Koramangala',
    category: 'home',
    members: [
      me,
      { id: 'mem_flat_neha', name: 'Neha Kapoor', email: 'neha@example.com' },
      { id: 'mem_flat_karan', name: 'Karan Mehta' },
    ],
    createdAt: at(now, 30, 9),
  };

  const weekend: Group = {
    id: 'grp_weekend',
    name: 'Weekend Plans',
    description: 'Movies, bowling and brunches',
    category: 'friends',
    members: [
      me,
      { id: 'mem_wk_sneha', name: 'Sneha Iyer' },
      { id: 'mem_wk_arjun', name: 'Arjun Nair', email: 'arjun@example.com' },
      { id: 'mem_wk_ishaan', name: 'Ishaan Gupta' },
    ],
    createdAt: at(now, 14, 18),
  };

  const goaAll = goa.members.map((m) => m.id);
  const flatAll = flat.members.map((m) => m.id);
  const weekendAll = weekend.members.map((m) => m.id);

  const expenses: Expense[] = [
    // Goa Trip
    equalExpense(
      { id: 'exp_goa_villa', groupId: goa.id, title: 'Villa booking (2 nights)', amount: 7200, category: 'stay', paidBy: CURRENT_USER_ID, date: at(now, 6, 11) },
      goaAll,
    ),
    equalExpense(
      { id: 'exp_goa_dinner', groupId: goa.id, title: 'Dinner at beach cafe', amount: 1500, category: 'food', paidBy: CURRENT_USER_ID, date: at(now, 5, 21) },
      goaAll,
    ),
    equalExpense(
      { id: 'exp_goa_cab', groupId: goa.id, title: 'Cab to hotel', amount: 900, category: 'travel', paidBy: 'mem_goa_rahul', date: at(now, 5, 23) },
      goaAll,
    ),
    equalExpense(
      { id: 'exp_goa_scooter', groupId: goa.id, title: 'Scooter rentals', amount: 1200, category: 'travel', paidBy: 'mem_goa_aman', date: at(now, 4, 9) },
      goaAll,
    ),
    unequalExpense(
      { id: 'exp_goa_parasail', groupId: goa.id, title: 'Parasailing at Calangute', amount: 2500, category: 'entertainment', paidBy: 'mem_goa_rahul', date: at(now, 3, 15) },
      [
        { memberId: CURRENT_USER_ID, shareAmount: 1000 },
        { memberId: 'mem_goa_rahul', shareAmount: 1000 },
        { memberId: 'mem_goa_aman', shareAmount: 500 },
      ],
    ),

    // Flatmates
    equalExpense(
      { id: 'exp_flat_power', groupId: flat.id, title: 'Electricity bill – October', amount: 2850, category: 'bills', paidBy: 'mem_flat_neha', date: at(now, 12, 19) },
      flatAll,
    ),
    equalExpense(
      { id: 'exp_flat_groceries', groupId: flat.id, title: 'Monthly groceries', amount: 1845.5, category: 'groceries', paidBy: CURRENT_USER_ID, date: at(now, 8, 18) },
      flatAll,
    ),
    equalExpense(
      { id: 'exp_flat_wifi', groupId: flat.id, title: 'Wi-Fi recharge', amount: 1199, category: 'bills', paidBy: 'mem_flat_karan', date: at(now, 6, 20) },
      flatAll,
    ),
    equalExpense(
      { id: 'exp_flat_cook', groupId: flat.id, title: 'Cook’s salary', amount: 3000, category: 'bills', paidBy: CURRENT_USER_ID, date: at(now, 2, 10) },
      flatAll,
    ),
    unequalExpense(
      { id: 'exp_flat_takeout', groupId: flat.id, title: 'Friday night takeout', amount: 960, category: 'food', paidBy: 'mem_flat_karan', date: at(now, 1, 22) },
      [
        { memberId: CURRENT_USER_ID, shareAmount: 420 },
        { memberId: 'mem_flat_neha', shareAmount: 300 },
        { memberId: 'mem_flat_karan', shareAmount: 240 },
      ],
    ),

    // Weekend Plans
    equalExpense(
      { id: 'exp_wk_movie', groupId: weekend.id, title: 'Movie night tickets', amount: 1360, category: 'entertainment', paidBy: 'mem_wk_sneha', date: at(now, 3, 20) },
      weekendAll,
    ),
    equalExpense(
      { id: 'exp_wk_bowling', groupId: weekend.id, title: 'Bowling & snacks', amount: 2200, category: 'entertainment', paidBy: 'mem_wk_arjun', date: at(now, 2, 17) },
      weekendAll,
    ),
    equalExpense(
      { id: 'exp_wk_brunch', groupId: weekend.id, title: 'Sunday brunch', amount: 3240, category: 'food', paidBy: 'mem_wk_arjun', date: at(now, 0, 9, 30) },
      [CURRENT_USER_ID, 'mem_wk_sneha', 'mem_wk_arjun'],
    ),
  ];

  const settlements: Settlement[] = [
    {
      id: 'set_goa_aman',
      groupId: goa.id,
      fromMemberId: 'mem_goa_aman',
      toMemberId: CURRENT_USER_ID,
      amount: 1000,
      date: at(now, 2, 13),
      createdAt: at(now, 2, 13),
    },
    {
      id: 'set_wk_arjun',
      groupId: weekend.id,
      fromMemberId: CURRENT_USER_ID,
      toMemberId: 'mem_wk_arjun',
      amount: 500,
      date: at(now, 1, 12),
      createdAt: at(now, 1, 12),
    },
  ];

  return {
    profile: { ...DEFAULT_PROFILE },
    groups: [goa, flat, weekend],
    expenses,
    settlements,
  };
}
