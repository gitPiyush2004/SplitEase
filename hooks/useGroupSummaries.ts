import { useMemo } from 'react';

import { Group } from '@/types';
import { getGroupTotalExpenses, getUserGroupBalance } from '@/utils/balanceCalculator';

import { useApp } from './useApp';

export interface GroupSummary {
  group: Group;
  totalSpent: number;
  /** The current user's balance in this group. */
  userBalance: number;
}

/** Each group with its total spending and the current user's balance. */
export function useGroupSummaries(): GroupSummary[] {
  const { groups, expenses, settlements } = useApp();

  return useMemo(
    () =>
      groups.map((group) => ({
        group,
        totalSpent: getGroupTotalExpenses(group.id, expenses),
        userBalance: getUserGroupBalance(group, expenses, settlements),
      })),
    [groups, expenses, settlements],
  );
}
