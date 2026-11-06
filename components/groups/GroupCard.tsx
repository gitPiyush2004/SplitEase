import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppCard } from '@/components/common/AppCard';
import { AvatarStack } from '@/components/common/Avatar';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { getGroupCategory } from '@/constants/categories';
import { colors, spacing, typography } from '@/constants/theme';
import { GroupSummary } from '@/hooks/useGroupSummaries';
import { getBalanceTone } from '@/utils/balanceTone';
import { formatCurrency } from '@/utils/formatCurrency';

export function GroupCard({ group, totalSpent, userBalance }: GroupSummary) {
  const category = getGroupCategory(group.category);
  const tone = getBalanceTone(userBalance);
  const memberLabel = `${group.members.length} ${group.members.length === 1 ? 'member' : 'members'}`;

  return (
    <AppCard
      onPress={() => router.push({ pathname: '/groups/[id]', params: { id: group.id } })}
      accessibilityLabel={`${group.name}, ${tone.label} ${formatCurrency(userBalance, { absolute: true })}`}
    >
      <View style={styles.top}>
        <CategoryIcon icon={category.icon} color={category.color} background={category.background} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={styles.meta}>
            {category.label} · {memberLabel}
          </Text>
        </View>
        <View style={styles.balance}>
          <Text style={[styles.balanceLabel, { color: tone.color }]}>{tone.label}</Text>
          {userBalance !== 0 && (
            <Text style={[styles.balanceAmount, { color: tone.color }]}>
              {formatCurrency(userBalance, { absolute: true })}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.bottom}>
        <AvatarStack members={group.members} size={26} />
        <Text style={styles.total}>
          Total spent <Text style={styles.totalAmount}>{formatCurrency(totalSpent)}</Text>
        </Text>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.bodySemibold,
    fontSize: 16,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  balance: {
    alignItems: 'flex-end',
  },
  balanceLabel: {
    ...typography.tiny,
  },
  balanceAmount: {
    ...typography.bodySemibold,
    marginTop: 1,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  total: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  totalAmount: {
    fontFamily: typography.bodySemibold.fontFamily,
    color: colors.text,
  },
});
