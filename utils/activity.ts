import { ActivityItem, CURRENT_USER_ID, Expense, Group, Member, Settlement } from '@/types';

/** Newest first: by date, then by when it was recorded. */
function compareNewestFirst(a: ActivityItem, b: ActivityItem): number {
  const byDate = new Date(b.date).getTime() - new Date(a.date).getTime();
  if (byDate !== 0) return byDate;
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

/** Combines expenses and settlements from every group into one sorted timeline. */
export function buildActivityFeed(
  groups: Group[],
  expenses: Expense[],
  settlements: Settlement[],
): ActivityItem[] {
  const groupsById = new Map(groups.map((group) => [group.id, group]));
  const items: ActivityItem[] = [];

  expenses.forEach((expense) => {
    const group = groupsById.get(expense.groupId);
    if (group) {
      items.push({
        type: 'expense',
        id: expense.id,
        date: expense.date,
        createdAt: expense.createdAt,
        expense,
        group,
      });
    }
  });

  settlements.forEach((settlement) => {
    const group = groupsById.get(settlement.groupId);
    if (group) {
      items.push({
        type: 'settlement',
        id: settlement.id,
        date: settlement.date,
        createdAt: settlement.createdAt,
        settlement,
        group,
      });
    }
  });

  return items.sort(compareNewestFirst);
}

export function findMember(group: Group, memberId: string): Member | undefined {
  return group.members.find((member) => member.id === memberId);
}

/** "You" for the current user, otherwise the member's name. */
export function getMemberName(group: Group, memberId: string): string {
  if (memberId === CURRENT_USER_ID) return 'You';
  return findMember(group, memberId)?.name ?? 'Former member';
}

/** First name only, e.g. "Rahul Sharma" → "Rahul" (and "You" for the current user). */
export function getMemberFirstName(group: Group, memberId: string): string {
  return getMemberName(group, memberId).split(' ')[0];
}
