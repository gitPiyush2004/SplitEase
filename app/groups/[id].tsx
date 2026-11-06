import { router, useLocalSearchParams } from 'expo-router';
import { ChevronRight, CircleCheck, HandCoins, Plus, Receipt, SearchX, Trash2 } from 'lucide-react-native';
import { Fragment, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { Avatar, AvatarStack } from '@/components/common/Avatar';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { EmptyState } from '@/components/common/EmptyState';
import { IconButton } from '@/components/common/IconButton';
import { goBackOrHome, ScreenHeader } from '@/components/common/ScreenHeader';
import { SectionHeader } from '@/components/common/SectionHeader';
import { useToast } from '@/components/common/Toast';
import { ActivityList } from '@/components/expenses/ActivityList';
import { getGroupCategory } from '@/constants/categories';
import { colors, SCREEN_PADDING, spacing, typography } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { CURRENT_USER_ID, Group, Settlement, SettlementSuggestion } from '@/types';
import { buildActivityFeed, getMemberName } from '@/utils/activity';
import {
  calculateGroupBalances,
  generateSettlementSuggestions,
  getGroupTotalExpenses,
  getUserRelations,
} from '@/utils/balanceCalculator';
import { getBalanceTone } from '@/utils/balanceTone';
import { formatCurrency } from '@/utils/formatCurrency';
import { confirmAction, getParam } from '@/utils/navigation';

export default function GroupDetailsScreen() {
  const id = getParam(useLocalSearchParams<{ id: string }>().id);
  const { groups } = useApp();
  const group = groups.find((g) => g.id === id);

  if (!group) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <ScreenHeader title="Group" showBack />
        <EmptyState
          icon={SearchX}
          title="Group not found"
          message="This group may have been deleted."
          actionLabel="Go back"
          onAction={goBackOrHome}
        />
      </SafeAreaView>
    );
  }

  return <GroupDetails group={group} />;
}

function GroupDetails({ group }: { group: Group }) {
  const { expenses, settlements, deleteGroup, deleteSettlement } = useApp();
  const showToast = useToast();
  const category = getGroupCategory(group.category);

  const { balances, suggestions, totalSpent, activity, expenseCount, hasSettlements } = useMemo(() => {
    const groupBalances = calculateGroupBalances(group, expenses, settlements);
    return {
      balances: groupBalances,
      suggestions: generateSettlementSuggestions(groupBalances),
      totalSpent: getGroupTotalExpenses(group.id, expenses),
      activity: buildActivityFeed([group], expenses, settlements),
      expenseCount: expenses.filter((e) => e.groupId === group.id).length,
      hasSettlements: settlements.some((s) => s.groupId === group.id),
    };
  }, [group, expenses, settlements]);

  const userBalance = balances[CURRENT_USER_ID] ?? 0;
  const userTone = getBalanceTone(userBalance);

  // "Rahul owes you ₹500" / "You owe Aman ₹300" first, "settled up" last.
  const relations = getUserRelations(group, suggestions).sort(
    (a, b) => Number(a.amount === 0) - Number(b.amount === 0),
  );
  const otherSuggestions = suggestions.filter(
    (s) => s.fromMemberId !== CURRENT_USER_ID && s.toMemberId !== CURRENT_USER_ID,
  );

  const openSettleUp = (suggestion?: SettlementSuggestion) => {
    router.push({
      pathname: '/settlements/create',
      params: suggestion
        ? {
            groupId: group.id,
            from: suggestion.fromMemberId,
            to: suggestion.toMemberId,
            amount: String(suggestion.amount),
          }
        : { groupId: group.id },
    });
  };

  const handleDeleteGroup = async () => {
    const confirmed = await confirmAction({
      title: `Delete ${group.name}?`,
      message: 'All expenses and settlements in this group will be permanently removed.',
      confirmText: 'Delete',
      destructive: true,
    });
    if (confirmed) {
      goBackOrHome();
      deleteGroup(group.id);
      showToast('Group deleted');
    }
  };

  const handleSettlementPress = async (settlement: Settlement) => {
    const from = getMemberName(group, settlement.fromMemberId);
    const to = getMemberName(group, settlement.toMemberId);
    const confirmed = await confirmAction({
      title: 'Delete this settlement?',
      message: `${from} paid ${to} ${formatCurrency(settlement.amount)}. Deleting it will restore the previous balances.`,
      confirmText: 'Delete',
      destructive: true,
    });
    if (confirmed) {
      deleteSettlement(settlement.id);
      showToast('Settlement deleted');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScreenHeader
        title={group.name}
        showBack
        right={
          <IconButton
            icon={Trash2}
            color={colors.negative}
            onPress={handleDeleteGroup}
            accessibilityLabel="Delete group"
          />
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Group header */}
        <AppCard style={styles.hero}>
          <View style={styles.heroTop}>
            <CategoryIcon icon={category.icon} color={category.color} background={category.background} size={56} />
            <View style={styles.flex}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupMeta}>
                {category.label} · {group.members.length} members
              </Text>
            </View>
          </View>
          {!!group.description && <Text style={styles.description}>{group.description}</Text>}

          <View style={styles.heroStats}>
            <View style={styles.flex}>
              <Text style={styles.statLabel}>Total spent</Text>
              <Text style={styles.statValue}>{formatCurrency(totalSpent)}</Text>
            </View>
            <View style={[styles.flex, styles.alignEnd]}>
              <Text style={styles.statLabel}>{userTone.label}</Text>
              <Text style={[styles.statValue, { color: userTone.color }]}>
                {formatCurrency(userBalance, { absolute: true })}
              </Text>
            </View>
          </View>

          <View style={styles.membersRow}>
            <AvatarStack members={group.members} size={30} max={5} />
            <Text style={styles.memberNames} numberOfLines={1}>
              {group.members.map((m) => getMemberName(group, m.id).split(' ')[0]).join(', ')}
            </Text>
          </View>
        </AppCard>

        {/* Actions */}
        <View style={styles.actions}>
          <AppButton
            title="Add expense"
            icon={Plus}
            onPress={() => router.push({ pathname: '/expenses/create', params: { groupId: group.id } })}
            style={styles.flex}
          />
          <AppButton
            title="Settle up"
            icon={HandCoins}
            variant="secondary"
            onPress={() => openSettleUp()}
            style={styles.flex}
          />
        </View>

        {/* Balances: each member's net position */}
        <View>
          <SectionHeader title="Balances" subtitle="Each member’s net position in this group" />
          <AppCard flush>
            {group.members.map((member, index) => {
              const amount = balances[member.id] ?? 0;
              const tone = getBalanceTone(amount);
              const label = amount > 0 ? 'gets back' : amount < 0 ? 'owes' : 'settled up';
              return (
                <Fragment key={member.id}>
                  {index > 0 && <View style={styles.divider} />}
                  <View style={styles.row}>
                    <Avatar id={member.id} name={member.name} size={36} />
                    <Text style={[styles.rowText, styles.flex]} numberOfLines={1}>
                      {getMemberName(group, member.id)}
                    </Text>
                    <View style={styles.alignEnd}>
                      <Text style={[styles.rowCaption, { color: tone.color }]}>{label}</Text>
                      {amount !== 0 && (
                        <Text style={[styles.rowAmount, { color: tone.color }]}>
                          {formatCurrency(amount, { absolute: true })}
                        </Text>
                      )}
                    </View>
                  </View>
                </Fragment>
              );
            })}
          </AppCard>
        </View>

        {/* Who owes whom, simplified with the greedy settlement algorithm */}
        <View>
          <SectionHeader title="Who owes whom" subtitle="Simplified to the fewest payments" />
          {suggestions.length === 0 ? (
            <AppCard style={styles.settledCard}>
              <CircleCheck size={22} color={colors.positive} />
              <Text style={styles.settledText}>Everyone in this group is settled up.</Text>
            </AppCard>
          ) : (
            <AppCard flush>
              {relations.map(({ member, amount }, index) => {
                const suggestion = suggestions.find(
                  (s) =>
                    (s.fromMemberId === member.id && s.toMemberId === CURRENT_USER_ID) ||
                    (s.fromMemberId === CURRENT_USER_ID && s.toMemberId === member.id),
                );
                const firstName = member.name.split(' ')[0];
                const text =
                  amount > 0
                    ? `${firstName} owes you`
                    : amount < 0
                      ? `You owe ${firstName}`
                      : `You’re settled up with ${firstName}`;
                return (
                  <Fragment key={member.id}>
                    {index > 0 && <View style={styles.divider} />}
                    <RelationRow
                      memberId={member.id}
                      memberName={member.name}
                      text={text}
                      amount={amount}
                      onPress={suggestion ? () => openSettleUp(suggestion) : undefined}
                    />
                  </Fragment>
                );
              })}
              {otherSuggestions.map((s) => (
                <Fragment key={`${s.fromMemberId}-${s.toMemberId}`}>
                  <View style={styles.divider} />
                  <RelationRow
                    memberId={s.fromMemberId}
                    memberName={getMemberName(group, s.fromMemberId)}
                    text={`${getMemberName(group, s.fromMemberId).split(' ')[0]} owes ${getMemberName(group, s.toMemberId).split(' ')[0]}`}
                    amount={s.amount}
                    neutral
                    onPress={() => openSettleUp(s)}
                  />
                </Fragment>
              ))}
            </AppCard>
          )}
        </View>

        {/* Expense history */}
        <View>
          <SectionHeader
            title="Expenses"
            subtitle={`${expenseCount} ${expenseCount === 1 ? 'expense' : 'expenses'}${hasSettlements ? ' · tap a settlement to remove it' : ''}`}
          />
          {activity.length === 0 ? (
            <AppCard>
              <EmptyState
                compact
                icon={Receipt}
                title="No expenses yet"
                message="Add the first expense and SplitEase will work out who owes what."
                actionLabel="Add expense"
                onAction={() => router.push({ pathname: '/expenses/create', params: { groupId: group.id } })}
              />
            </AppCard>
          ) : (
            <ActivityList items={activity} onSettlementPress={handleSettlementPress} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

interface RelationRowProps {
  memberId: string;
  memberName: string;
  text: string;
  amount: number;
  /** Debts between two other members are shown without red/green. */
  neutral?: boolean;
  onPress?: () => void;
}

function RelationRow({ memberId, memberName, text, amount, neutral, onPress }: RelationRowProps) {
  const tone = getBalanceTone(amount);
  const color = neutral ? colors.text : tone.color;

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <Avatar id={memberId} name={memberName} size={36} />
      <Text style={[styles.rowText, styles.flex, amount === 0 && styles.mutedText]} numberOfLines={2}>
        {text}
      </Text>
      {amount !== 0 && (
        <Text style={[styles.rowAmount, { color }]}>{formatCurrency(amount, { absolute: true })}</Text>
      )}
      {onPress && <ChevronRight size={18} color={colors.textMuted} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxl,
  },
  flex: {
    flex: 1,
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  hero: {
    padding: spacing.xl,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  groupName: {
    ...typography.h2,
    color: colors.text,
  },
  groupMeta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  heroStats: {
    flexDirection: 'row',
    marginTop: spacing.xl,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
    marginTop: 2,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  memberNames: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowPressed: {
    backgroundColor: colors.background,
  },
  rowText: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  mutedText: {
    color: colors.textSecondary,
  },
  rowCaption: {
    ...typography.tiny,
  },
  rowAmount: {
    ...typography.bodySemibold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg + 36 + spacing.md,
  },
  settledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.positiveSoft,
    borderColor: colors.positiveSoft,
  },
  settledText: {
    ...typography.bodyMedium,
    color: colors.text,
    flex: 1,
  },
});
