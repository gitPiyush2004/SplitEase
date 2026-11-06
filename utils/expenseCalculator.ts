import { Expense, ExpenseParticipant, SplitType } from '@/types';

import { fromPaise, toPaise } from './money';

/**
 * Splits an amount equally between members so the shares always add up
 * to the exact total.
 *
 * Example: ₹100 between 3 people → 33.34, 33.33, 33.33
 * We work in paise: 10000 / 3 = 3333 remainder 1. The leftover paise are
 * handed out one at a time to the first members in the list.
 */
export function splitEqually(amount: number, memberIds: string[]): ExpenseParticipant[] {
  if (memberIds.length === 0) {
    return [];
  }
  const totalPaise = toPaise(amount);
  const baseShare = Math.floor(totalPaise / memberIds.length);
  const remainder = totalPaise - baseShare * memberIds.length;

  return memberIds.map((memberId, index) => ({
    memberId,
    shareAmount: fromPaise(baseShare + (index < remainder ? 1 : 0)),
  }));
}

/** Adds up participant shares exactly (via paise). */
export function sumShares(participants: ExpenseParticipant[]): number {
  const totalPaise = participants.reduce((sum, p) => sum + toPaise(p.shareAmount), 0);
  return fromPaise(totalPaise);
}

/**
 * How much of the total is still unassigned in an unequal split.
 * Positive: more to assign. Negative: shares exceed the total.
 */
export function getRemainingAmount(amount: number, participants: ExpenseParticipant[]): number {
  return fromPaise(toPaise(amount) - toPaise(sumShares(participants)));
}

/** The share a member owes for an expense (0 if they didn't take part). */
export function getMemberShare(expense: Expense, memberId: string): number {
  return expense.participants.find((p) => p.memberId === memberId)?.shareAmount ?? 0;
}

/**
 * How an expense changes one member's balance.
 * Positive: they lent money (paid more than their share).
 * Negative: they borrowed (their share was paid by someone else).
 */
export function getExpenseImpact(expense: Expense, memberId: string): number {
  const paid = expense.paidByMemberId === memberId ? toPaise(expense.amount) : 0;
  const share = toPaise(getMemberShare(expense, memberId));
  return fromPaise(paid - share);
}

export interface ExpenseDraft {
  title: string;
  amount: number | null;
  paidByMemberId: string;
  participantIds: string[];
  splitType: SplitType;
  /** Custom share per member for unequal splits (null = empty/invalid input). */
  customShares: Record<string, number | null>;
  /** IDs of everyone in the selected group, used to validate the payer and participants. */
  groupMemberIds: string[];
}

export interface ExpenseDraftErrors {
  title?: string;
  amount?: string;
  paidBy?: string;
  participants?: string;
  split?: string;
}

export type ExpenseValidationResult =
  | { isValid: true; participants: ExpenseParticipant[] }
  | { isValid: false; errors: ExpenseDraftErrors };

/**
 * Validates the Add Expense form and, when valid, returns the final
 * participant shares to save.
 */
export function validateExpenseDraft(draft: ExpenseDraft): ExpenseValidationResult {
  const errors: ExpenseDraftErrors = {};

  if (!draft.title.trim()) {
    errors.title = 'Add a short description, like "Dinner".';
  }
  if (draft.amount === null || draft.amount <= 0) {
    errors.amount = 'Enter an amount greater than ₹0.';
  }
  if (!draft.groupMemberIds.includes(draft.paidByMemberId)) {
    errors.paidBy = 'Choose who paid.';
  }

  const participantIds = draft.participantIds.filter((id) => draft.groupMemberIds.includes(id));
  if (participantIds.length === 0) {
    errors.participants = 'Select at least one person to split with.';
  }

  let participants: ExpenseParticipant[] = [];
  if (draft.amount !== null && draft.amount > 0 && participantIds.length > 0) {
    if (draft.splitType === 'equal') {
      participants = splitEqually(draft.amount, participantIds);
    } else {
      const hasInvalidShare = participantIds.some((id) => {
        const share = draft.customShares[id];
        return share === null || share === undefined || share <= 0;
      });
      participants = participantIds.map((id) => ({
        memberId: id,
        shareAmount: draft.customShares[id] ?? 0,
      }));
      const remaining = getRemainingAmount(draft.amount, participants);

      if (hasInvalidShare) {
        errors.split = 'Enter a share above ₹0 for every selected person, or deselect them.';
      } else if (remaining !== 0) {
        errors.split = 'Shares must add up to the total amount.';
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { isValid: false, errors };
  }
  return { isValid: true, participants };
}
