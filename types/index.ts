/**
 * Core data models for SplitEase.
 *
 * All money values are stored in rupees (e.g. 1845.5) with at most two
 * decimal places. Any arithmetic on money is done in integer paise
 * (see utils/money.ts) to avoid floating-point errors.
 */

/** Stable ID used for the person using the app. */
export const CURRENT_USER_ID = 'me';

export type GroupCategory = 'trip' | 'home' | 'couple' | 'friends' | 'other';

export type ExpenseCategory =
  | 'food'
  | 'groceries'
  | 'travel'
  | 'stay'
  | 'bills'
  | 'entertainment'
  | 'shopping'
  | 'other';

export type SplitType = 'equal' | 'unequal';

export interface Member {
  id: string;
  name: string;
  email?: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  category: GroupCategory;
  members: Member[];
  createdAt: string; // ISO date string
}

export interface ExpenseParticipant {
  memberId: string;
  shareAmount: number;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  amount: number;
  category: ExpenseCategory;
  paidByMemberId: string;
  participants: ExpenseParticipant[];
  splitType: SplitType;
  date: string; // ISO date string — when the expense happened
  createdAt: string; // ISO date string — when it was recorded
}

/** A recorded payment: `fromMemberId` paid `toMemberId` to clear a debt. */
export interface Settlement {
  id: string;
  groupId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  email: string;
}

/** Everything the app persists, saved together as a single snapshot. */
export interface AppData {
  profile: UserProfile;
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
}

/**
 * Member ID → balance in rupees.
 * Positive: the member is owed money. Negative: the member owes money.
 */
export type BalanceMap = Record<string, number>;

/** A suggested (not yet recorded) payment that would help settle a group. */
export interface SettlementSuggestion {
  fromMemberId: string;
  toMemberId: string;
  amount: number;
}

/** A single entry in the activity feed — either an expense or a settlement. */
export type ActivityItem =
  | { type: 'expense'; id: string; date: string; createdAt: string; expense: Expense; group: Group }
  | { type: 'settlement'; id: string; date: string; createdAt: string; settlement: Settlement; group: Group };
