import { router, useLocalSearchParams } from 'expo-router';
import { Calendar, Check, ChevronLeft, ChevronRight, UsersRound } from 'lucide-react-native';
import { Fragment, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { AppInput } from '@/components/common/AppInput';
import { Avatar } from '@/components/common/Avatar';
import { Chip } from '@/components/common/Chip';
import { EmptyState } from '@/components/common/EmptyState';
import { FormField } from '@/components/common/FormField';
import { FormScreen } from '@/components/common/FormScreen';
import { HorizontalChips } from '@/components/common/HorizontalChips';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { useToast } from '@/components/common/Toast';
import { EXPENSE_CATEGORIES } from '@/constants/categories';
import { colors, fonts, radius, spacing, typography } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { ExpenseCategory, Group, SplitType } from '@/types';
import { getMemberName } from '@/utils/activity';
import { addDays, formatLongDate, isSameDay, startOfDay } from '@/utils/date';
import { getRemainingAmount, splitEqually, validateExpenseDraft } from '@/utils/expenseCalculator';
import { formatCurrency } from '@/utils/formatCurrency';
import { amountToInput, parseAmount, sanitizeAmountInput, toPaise } from '@/utils/money';
import { getParam } from '@/utils/navigation';

const SPLIT_OPTIONS: { value: SplitType; label: string }[] = [
  { value: 'equal', label: 'Split equally' },
  { value: 'unequal', label: 'Custom amounts' },
];

export default function AddExpenseScreen() {
  const paramGroupId = getParam(useLocalSearchParams<{ groupId: string }>().groupId);
  const { groups } = useApp();

  if (groups.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <ScreenHeader title="Add expense" showBack />
        <EmptyState
          icon={UsersRound}
          title="Create a group first"
          message="Expenses belong to a group. Create one with the people you’re splitting with."
          actionLabel="Create a group"
          onAction={() => router.replace('/groups/create')}
        />
      </SafeAreaView>
    );
  }

  const initialGroup = groups.find((g) => g.id === paramGroupId) ?? groups[0];
  return <ExpenseForm initialGroup={initialGroup} openedFromGroupId={paramGroupId} />;
}

interface ExpenseFormProps {
  initialGroup: Group;
  openedFromGroupId?: string;
}

function ExpenseForm({ initialGroup, openedFromGroupId }: ExpenseFormProps) {
  const { groups, addExpense } = useApp();
  const showToast = useToast();

  const [groupId, setGroupId] = useState(initialGroup.id);
  const [title, setTitle] = useState('');
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [paidBy, setPaidBy] = useState(initialGroup.members[0].id);
  const [participantIds, setParticipantIds] = useState(initialGroup.members.map((m) => m.id));
  const [splitType, setSplitType] = useState<SplitType>('equal');
  const [customShares, setCustomShares] = useState<Record<string, string>>({});
  const [day, setDay] = useState(() => startOfDay(new Date()));
  const [showErrors, setShowErrors] = useState(false);

  // If the group was deleted while this screen is open, fall back to the first group.
  const group = groups.find((g) => g.id === groupId) ?? groups[0];
  const amount = parseAmount(amountText);
  const isToday = isSameDay(day, new Date());

  // Keep participants in the same order as the group's member list.
  const selectedIds = group.members.map((m) => m.id).filter((id) => participantIds.includes(id));

  const parsedShares: Record<string, number | null> = {};
  selectedIds.forEach((id) => {
    parsedShares[id] = parseAmount(customShares[id] ?? '');
  });

  const validation = validateExpenseDraft({
    title,
    amount,
    paidByMemberId: paidBy,
    participantIds: selectedIds,
    splitType,
    customShares: parsedShares,
    groupMemberIds: group.members.map((m) => m.id),
  });
  const errors = showErrors && !validation.isValid ? validation.errors : {};

  // Live preview of each person's share
  const equalShares = amount ? splitEqually(amount, selectedIds) : [];
  const remaining =
    amount !== null
      ? getRemainingAmount(
          amount,
          selectedIds.map((id) => ({ memberId: id, shareAmount: parsedShares[id] ?? 0 })),
        )
      : null;

  const changeGroup = (next: Group) => {
    setGroupId(next.id);
    setPaidBy(next.members[0].id);
    setParticipantIds(next.members.map((m) => m.id));
    setCustomShares({});
  };

  const toggleParticipant = (memberId: string) => {
    setParticipantIds((current) =>
      current.includes(memberId) ? current.filter((id) => id !== memberId) : [...current, memberId],
    );
  };

  const changeSplitType = (next: SplitType) => {
    // Pre-fill custom amounts with the equal split so the user only adjusts what differs.
    if (next === 'unequal' && amount) {
      const prefill: Record<string, string> = {};
      splitEqually(amount, selectedIds).forEach((share) => {
        prefill[share.memberId] = amountToInput(share.shareAmount);
      });
      setCustomShares(prefill);
    }
    setSplitType(next);
  };

  const handleSubmit = () => {
    setShowErrors(true);
    if (!validation.isValid || amount === null) return;

    // Use the chosen day, with the current time so same-day items stay in order.
    const now = new Date();
    const date = new Date(day);
    date.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    addExpense({
      groupId: group.id,
      title,
      amount,
      category,
      paidByMemberId: paidBy,
      participants: validation.participants,
      splitType,
      date: date.toISOString(),
    });
    showToast('Expense added');

    if (openedFromGroupId === group.id && router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: '/groups/[id]', params: { id: group.id } });
    }
  };

  return (
    <FormScreen
      header={<ScreenHeader title="Add expense" showBack />}
      footer={<AppButton title="Save expense" size="lg" onPress={handleSubmit} />}
    >
      {/* Amount */}
      <AppCard style={styles.amountCard}>
        <Text style={styles.amountLabel}>Amount</Text>
        <View style={styles.amountRow}>
          <Text style={[styles.currency, amountText ? styles.currencyActive : null]}>₹</Text>
          <TextInput
            value={amountText}
            onChangeText={(text) => setAmountText(sanitizeAmountInput(text))}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            keyboardType="decimal-pad"
            // Grow with the text so the ₹ sign stays right next to the number.
            style={[styles.amountInput, { width: Math.max(amountText.length, 1) * 26 + 16 }]}
            selectionColor={colors.primary}
            accessibilityLabel="Amount in rupees"
            maxLength={10}
          />
        </View>
        {errors.amount && <Text style={styles.amountError}>{errors.amount}</Text>}
      </AppCard>

      <AppInput
        label="Description"
        placeholder="e.g. Dinner at beach cafe"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        maxLength={60}
        autoCapitalize="sentences"
      />

      <FormField label="Category">
        <HorizontalChips>
          {EXPENSE_CATEGORIES.map((item) => (
            <Chip
              key={item.key}
              label={item.label}
              icon={item.icon}
              selected={category === item.key}
              onPress={() => setCategory(item.key)}
            />
          ))}
        </HorizontalChips>
      </FormField>

      <FormField label="Group">
        <HorizontalChips>
          {groups.map((item) => (
            <Chip
              key={item.id}
              label={item.name}
              selected={item.id === group.id}
              onPress={() => item.id !== group.id && changeGroup(item)}
            />
          ))}
        </HorizontalChips>
      </FormField>

      <FormField label="Paid by" error={errors.paidBy}>
        <HorizontalChips>
          {group.members.map((member) => (
            <Chip
              key={member.id}
              label={getMemberName(group, member.id)}
              selected={paidBy === member.id}
              onPress={() => setPaidBy(member.id)}
              leading={<Avatar id={member.id} name={member.name} size={22} />}
            />
          ))}
        </HorizontalChips>
      </FormField>

      <FormField label="Date">
        <AppCard style={styles.dateCard}>
          <Pressable
            onPress={() => setDay((d) => addDays(d, -1))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Previous day"
            style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}
          >
            <ChevronLeft size={18} color={colors.text} />
          </Pressable>
          <View style={styles.dateCenter}>
            <Calendar size={16} color={colors.primary} />
            <Text style={styles.dateText}>
              {isToday ? 'Today' : formatLongDate(day)}
            </Text>
          </View>
          <Pressable
            onPress={() => setDay((d) => addDays(d, 1))}
            disabled={isToday}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Next day"
            style={({ pressed }) => [styles.dateButton, isToday && styles.disabled, pressed && styles.pressed]}
          >
            <ChevronRight size={18} color={colors.text} />
          </Pressable>
        </AppCard>
      </FormField>

      <FormField label="Split">
        <SegmentedControl options={SPLIT_OPTIONS} value={splitType} onChange={changeSplitType} />
      </FormField>

      <FormField
        label="Split between"
        aside={
          <Text style={styles.aside}>
            {selectedIds.length} of {group.members.length} selected
          </Text>
        }
        error={errors.participants ?? errors.split}
      >
        <AppCard flush>
          {group.members.map((member, index) => {
            const isSelected = selectedIds.includes(member.id);
            const equalShare = equalShares.find((s) => s.memberId === member.id)?.shareAmount;
            return (
              <Fragment key={member.id}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.participantRow}>
                  <Pressable
                    onPress={() => toggleParticipant(member.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={getMemberName(group, member.id)}
                    style={styles.participantMain}
                  >
                    <View style={[styles.checkbox, isSelected && styles.checkboxOn]}>
                      {isSelected && <Check size={14} color={colors.white} strokeWidth={3} />}
                    </View>
                    <Avatar id={member.id} name={member.name} size={34} />
                    <Text style={[styles.participantName, !isSelected && styles.muted]} numberOfLines={1}>
                      {getMemberName(group, member.id)}
                    </Text>
                  </Pressable>

                  {isSelected && splitType === 'equal' && (
                    <Text style={styles.shareText}>
                      {equalShare !== undefined ? formatCurrency(equalShare) : '—'}
                    </Text>
                  )}
                  {isSelected && splitType === 'unequal' && (
                    <View style={styles.shareInputWrap}>
                      <Text style={styles.sharePrefix}>₹</Text>
                      <TextInput
                        value={customShares[member.id] ?? ''}
                        onChangeText={(text) =>
                          setCustomShares((current) => ({ ...current, [member.id]: sanitizeAmountInput(text) }))
                        }
                        placeholder="0"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="decimal-pad"
                        style={styles.shareInput}
                        selectionColor={colors.primary}
                        accessibilityLabel={`Share for ${getMemberName(group, member.id)}`}
                      />
                    </View>
                  )}
                </View>
              </Fragment>
            );
          })}

          {splitType === 'unequal' && <RemainingBanner amount={amount} remaining={remaining} />}
        </AppCard>
      </FormField>
    </FormScreen>
  );
}

/** Shows how much of the total is still unassigned in a custom split. */
function RemainingBanner({ amount, remaining }: { amount: number | null; remaining: number | null }) {
  let text = 'Enter the total amount first';
  let color: string = colors.textSecondary;
  let background: string = colors.divider;

  if (amount !== null && remaining !== null) {
    const paise = toPaise(remaining);
    if (paise === 0) {
      text = `All ${formatCurrency(amount)} assigned`;
      color = colors.positive;
      background = colors.positiveSoft;
    } else if (paise > 0) {
      text = `${formatCurrency(remaining)} left to assign`;
      color = colors.warning;
      background = colors.warningSoft;
    } else {
      text = `${formatCurrency(-remaining)} over the total`;
      color = colors.negative;
      background = colors.negativeSoft;
    }
  }

  return (
    <View style={[styles.remaining, { backgroundColor: background }]}>
      <Text style={[styles.remainingText, { color }]}>{text}</Text>
    </View>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  amountCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  amountLabel: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  currency: {
    fontFamily: fonts.semibold,
    fontSize: 32,
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  currencyActive: {
    color: colors.text,
  },
  amountInput: {
    maxWidth: 280,
    fontFamily: fonts.bold,
    fontSize: 42,
    color: colors.text,
    paddingVertical: spacing.xs,
    textAlign: 'center',
  },
  amountError: {
    ...typography.caption,
    color: colors.negative,
    marginTop: spacing.xs,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  dateButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm + 2,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dateText: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.35,
  },
  aside: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.lg,
  },
  participantMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: spacing.lg,
    paddingVertical: spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  participantName: {
    ...typography.bodyMedium,
    color: colors.text,
    flex: 1,
  },
  muted: {
    color: colors.textMuted,
  },
  shareText: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  shareInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 110,
    height: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm + 2,
    paddingHorizontal: spacing.sm + 2,
    backgroundColor: colors.background,
  },
  sharePrefix: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginRight: 2,
  },
  shareInput: {
    flex: 1,
    fontFamily: fonts.semibold,
    fontSize: 15,
    color: colors.text,
    textAlign: 'right',
    paddingVertical: 0,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg + 22 + spacing.md,
  },
  remaining: {
    margin: spacing.md,
    marginTop: spacing.xs,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm + 2,
    alignItems: 'center',
  },
  remainingText: {
    ...typography.captionMedium,
  },
});
