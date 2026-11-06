import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/common/CategoryIcon';
import { getExpenseCategory } from '@/constants/categories';
import { colors, spacing, typography } from '@/constants/theme';
import { CURRENT_USER_ID, Expense, Group } from '@/types';
import { getMemberFirstName } from '@/utils/activity';
import { formatRelativeDay } from '@/utils/date';
import { getExpenseImpact } from '@/utils/expenseCalculator';
import { formatCurrency } from '@/utils/formatCurrency';
import { toPaise } from '@/utils/money';

interface ExpenseItemProps {
  expense: Expense;
  group: Group;
  /** Show the group name (useful in cross-group lists like Activity). */
  showGroup?: boolean;
  showDate?: boolean;
  onPress: () => void;
}

/** What this expense means for the current user, e.g. "you lent ₹1,000". */
function getUserContext(expense: Expense) {
  const isInvolved =
    expense.paidByMemberId === CURRENT_USER_ID ||
    expense.participants.some((p) => p.memberId === CURRENT_USER_ID);
  const impact = toPaise(getExpenseImpact(expense, CURRENT_USER_ID));

  if (!isInvolved) return { label: 'not involved', amount: null, color: colors.textMuted };
  if (impact > 0) return { label: 'you lent', amount: impact / 100, color: colors.positive };
  if (impact < 0) return { label: 'you borrowed', amount: -impact / 100, color: colors.negative };
  return { label: 'no balance', amount: null, color: colors.textMuted };
}

export function ExpenseItem({ expense, group, showGroup = false, showDate = true, onPress }: ExpenseItemProps) {
  const category = getExpenseCategory(expense.category);
  const payer = getMemberFirstName(group, expense.paidByMemberId);
  const context = getUserContext(expense);

  const metaParts = [`${payer} paid ${formatCurrency(expense.amount)}`];
  if (showGroup) metaParts.push(group.name);
  if (showDate) metaParts.push(formatRelativeDay(expense.date));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${expense.title}, ${formatCurrency(expense.amount)}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <CategoryIcon icon={category.icon} color={category.color} background={category.background} size={42} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {expense.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {metaParts.join(' · ')}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.contextLabel, { color: context.color }]}>{context.label}</Text>
        {context.amount !== null && (
          <Text style={[styles.contextAmount, { color: context.color }]}>
            {formatCurrency(context.amount)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

export const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  pressed: {
    backgroundColor: colors.background,
  },
  info: {
    flex: 1,
  },
  title: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    maxWidth: 110,
  },
  contextLabel: {
    ...typography.tiny,
  },
  contextAmount: {
    ...typography.bodySemibold,
    marginTop: 1,
  },
});

const styles = rowStyles;
