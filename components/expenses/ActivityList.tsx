import { router } from 'expo-router';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/common/AppCard';
import { colors, spacing } from '@/constants/theme';
import { ActivityItem, Settlement } from '@/types';

import { ExpenseItem } from './ExpenseItem';
import { SettlementItem } from './SettlementItem';

interface ActivityListProps {
  items: ActivityItem[];
  showGroup?: boolean;
  /** Hide per-row dates when the list is already grouped by day. */
  showDate?: boolean;
  /** What tapping a settlement does. Defaults to opening its group. */
  onSettlementPress?: (settlement: Settlement) => void;
}

/** A card listing expenses and settlements, separated by dividers. */
export function ActivityList({ items, showGroup = false, showDate = true, onSettlementPress }: ActivityListProps) {
  const openSettlement = (settlement: Settlement) => {
    if (onSettlementPress) {
      onSettlementPress(settlement);
    } else {
      router.push({ pathname: '/groups/[id]', params: { id: settlement.groupId } });
    }
  };

  return (
    <AppCard flush style={styles.card}>
      {items.map((item, index) => (
        <Fragment key={`${item.type}-${item.id}`}>
          {index > 0 && <View style={styles.divider} />}
          {item.type === 'expense' ? (
            <ExpenseItem
              expense={item.expense}
              group={item.group}
              showGroup={showGroup}
              showDate={showDate}
              onPress={() => router.push({ pathname: '/expenses/[id]', params: { id: item.expense.id } })}
            />
          ) : (
            <SettlementItem
              settlement={item.settlement}
              group={item.group}
              showGroup={showGroup}
              showDate={showDate}
              onPress={() => openSettlement(item.settlement)}
            />
          )}
        </Fragment>
      ))}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg + 42 + spacing.md,
  },
});
