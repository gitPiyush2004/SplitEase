import { router, useLocalSearchParams } from 'expo-router';
import { Calendar, SearchX, Trash2, UsersRound, Wallet } from 'lucide-react-native';
import { Fragment, ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { Avatar } from '@/components/common/Avatar';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { EmptyState } from '@/components/common/EmptyState';
import { goBackOrHome, ScreenHeader } from '@/components/common/ScreenHeader';
import { SectionHeader } from '@/components/common/SectionHeader';
import { useToast } from '@/components/common/Toast';
import { getExpenseCategory } from '@/constants/categories';
import { colors, radius, SCREEN_PADDING, spacing, typography } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { Expense, Group } from '@/types';
import { getMemberFirstName, getMemberName } from '@/utils/activity';
import { formatDate } from '@/utils/date';
import { formatCurrency } from '@/utils/formatCurrency';
import { confirmAction, getParam } from '@/utils/navigation';

export default function ExpenseDetailsScreen() {
  const id = getParam(useLocalSearchParams<{ id: string }>().id);
  const { expenses, groups } = useApp();
  const expense = expenses.find((e) => e.id === id);
  const group = expense && groups.find((g) => g.id === expense.groupId);

  if (!expense || !group) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <ScreenHeader title="Expense" showBack />
        <EmptyState
          icon={SearchX}
          title="Expense not found"
          message="This expense may have been deleted."
          actionLabel="Go back"
          onAction={goBackOrHome}
        />
      </SafeAreaView>
    );
  }

  return <ExpenseDetails expense={expense} group={group} />;
}

function ExpenseDetails({ expense, group }: { expense: Expense; group: Group }) {
  const { deleteExpense } = useApp();
  const showToast = useToast();
  const category = getExpenseCategory(expense.category);
  const payerName = getMemberName(group, expense.paidByMemberId);

  const handleDelete = async () => {
    const confirmed = await confirmAction({
      title: 'Delete this expense?',
      message: `“${expense.title}” will be removed and balances in ${group.name} will be recalculated.`,
      confirmText: 'Delete',
      destructive: true,
    });
    if (confirmed) {
      goBackOrHome();
      deleteExpense(expense.id);
      showToast('Expense deleted');
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <ScreenHeader title="Expense details" showBack />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <AppCard style={styles.hero}>
          <CategoryIcon icon={category.icon} color={category.color} background={category.background} size={60} />
          <Text style={styles.title}>{expense.title}</Text>
          <Text style={styles.amount}>{formatCurrency(expense.amount)}</Text>
          <View style={styles.badges}>
            <Badge text={category.label} />
            <Badge text={expense.splitType === 'equal' ? 'Split equally' : 'Custom split'} />
          </View>
        </AppCard>

        {/* Details */}
        <AppCard flush>
          <DetailRow icon={<Wallet size={18} color={colors.primary} />} label="Paid by" value={payerName} />
          <View style={styles.divider} />
          <DetailRow
            icon={<UsersRound size={18} color={colors.primary} />}
            label="Group"
            value={group.name}
            onPress={() => router.push({ pathname: '/groups/[id]', params: { id: group.id } })}
          />
          <View style={styles.divider} />
          <DetailRow icon={<Calendar size={18} color={colors.primary} />} label="Date" value={formatDate(expense.date)} />
        </AppCard>

        {/* Shares */}
        <View>
          <SectionHeader
            title="Shares"
            subtitle={`Split between ${expense.participants.length} ${expense.participants.length === 1 ? 'person' : 'people'}`}
          />
          <AppCard flush>
            {expense.participants.map((participant, index) => {
              const name = getMemberName(group, participant.memberId);
              const isPayer = participant.memberId === expense.paidByMemberId;
              const payerFirstName = getMemberFirstName(group, expense.paidByMemberId);
              const status = isPayer
                ? 'paid the bill'
                : `owes ${payerFirstName === 'You' ? 'you' : payerFirstName}`;
              const memberName = group.members.find((m) => m.id === participant.memberId)?.name ?? name;
              return (
                <Fragment key={participant.memberId}>
                  {index > 0 && <View style={styles.shareDivider} />}
                  <View style={styles.shareRow}>
                    <Avatar id={participant.memberId} name={memberName} size={36} />
                    <View style={styles.flex}>
                      <Text style={styles.shareName}>{name}</Text>
                      <Text style={styles.shareStatus}>{status}</Text>
                    </View>
                    <Text style={styles.shareAmount}>{formatCurrency(participant.shareAmount)}</Text>
                  </View>
                </Fragment>
              );
            })}
          </AppCard>
        </View>

        <AppButton title="Delete expense" icon={Trash2} variant="danger" onPress={handleDelete} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{text}</Text>
    </View>
  );
}

interface DetailRowProps {
  icon: ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
}

function DetailRow({ icon, label, value, onPress }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>{icon}</View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, onPress && styles.link]}
        onPress={onPress}
        numberOfLines={1}
        accessibilityRole={onPress ? 'link' : undefined}
      >
        {value}
      </Text>
    </View>
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
    paddingBottom: spacing.xxl,
    gap: spacing.xxl,
  },
  flex: {
    flex: 1,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  title: {
    ...typography.h3,
    color: colors.text,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  amount: {
    ...typography.display,
    color: colors.text,
    marginTop: spacing.xs,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  badge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  badgeText: {
    ...typography.tiny,
    color: colors.primary,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm + 2,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    ...typography.bodySemibold,
    color: colors.text,
    maxWidth: '60%',
  },
  link: {
    color: colors.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg + 34 + spacing.md,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  shareName: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  shareStatus: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  shareAmount: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  shareDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg + 36 + spacing.md,
  },
});
