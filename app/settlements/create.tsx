import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight, CircleCheck, Info, UsersRound } from 'lucide-react-native';
import { Fragment, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { useToast } from '@/components/common/Toast';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { CURRENT_USER_ID, Group, SettlementSuggestion } from '@/types';
import { getMemberName } from '@/utils/activity';
import {
  calculateGroupBalances,
  generateSettlementSuggestions,
  getMaxSettlementAmount,
  validateSettlement,
} from '@/utils/balanceCalculator';
import { formatCurrency } from '@/utils/formatCurrency';
import { amountToInput, parseAmount, sanitizeAmountInput } from '@/utils/money';
import { getParam } from '@/utils/navigation';

export default function SettleUpScreen() {
  const params = useLocalSearchParams<{ groupId: string; from: string; to: string; amount: string }>();
  const { groups } = useApp();

  if (groups.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={styles.screen}>
        <ScreenHeader title="Settle up" showBack />
        <EmptyState
          icon={UsersRound}
          title="No groups yet"
          message="Create a group and add expenses before recording settlements."
          actionLabel="Create a group"
          onAction={() => router.replace('/groups/create')}
        />
      </SafeAreaView>
    );
  }

  const groupId = getParam(params.groupId);
  const group = groups.find((g) => g.id === groupId) ?? groups[0];

  return (
    <SettleUpForm
      initialGroup={group}
      openedFromGroupId={groupId}
      initialFrom={getParam(params.from)}
      initialTo={getParam(params.to)}
      initialAmount={getParam(params.amount)}
    />
  );
}

interface SettleUpFormProps {
  initialGroup: Group;
  openedFromGroupId?: string;
  initialFrom?: string;
  initialTo?: string;
  initialAmount?: string;
}

/** Picks sensible starting values: route params if valid, else the first suggested payment. */
function getDefaults(group: Group, suggestions: SettlementSuggestion[], from?: string, to?: string, amount?: string) {
  const memberIds = group.members.map((m) => m.id);
  if (from && to && memberIds.includes(from) && memberIds.includes(to)) {
    const parsed = amount ? parseAmount(amount) : null;
    return { from, to, amount: parsed ? amountToInput(parsed) : '' };
  }
  const first = suggestions[0];
  if (first) {
    return { from: first.fromMemberId, to: first.toMemberId, amount: amountToInput(first.amount) };
  }
  const other = group.members.find((m) => m.id !== CURRENT_USER_ID);
  return { from: CURRENT_USER_ID, to: other?.id ?? CURRENT_USER_ID, amount: '' };
}

function SettleUpForm({ initialGroup, openedFromGroupId, initialFrom, initialTo, initialAmount }: SettleUpFormProps) {
  const { groups, expenses, settlements, addSettlement } = useApp();
  const showToast = useToast();

  const [groupId, setGroupId] = useState(initialGroup.id);
  const group = groups.find((g) => g.id === groupId) ?? groups[0];

  const { balances, suggestions } = useMemo(() => {
    const groupBalances = calculateGroupBalances(group, expenses, settlements);
    return { balances: groupBalances, suggestions: generateSettlementSuggestions(groupBalances) };
  }, [group, expenses, settlements]);

  const [defaults] = useState(() => getDefaults(group, suggestions, initialFrom, initialTo, initialAmount));
  const [fromId, setFromId] = useState(defaults.from);
  const [toId, setToId] = useState(defaults.to);
  const [amountText, setAmountText] = useState(defaults.amount);
  const [error, setError] = useState<string | null>(null);

  const maxAmount = getMaxSettlementAmount(balances, fromId, toId);
  const name = (memberId: string) => getMemberName(group, memberId);

  const applySuggestion = (suggestion: SettlementSuggestion) => {
    setFromId(suggestion.fromMemberId);
    setToId(suggestion.toMemberId);
    setAmountText(amountToInput(suggestion.amount));
    setError(null);
  };

  const changeGroup = (next: Group) => {
    const nextBalances = calculateGroupBalances(next, expenses, settlements);
    const nextDefaults = getDefaults(next, generateSettlementSuggestions(nextBalances));
    setGroupId(next.id);
    setFromId(nextDefaults.from);
    setToId(nextDefaults.to);
    setAmountText(nextDefaults.amount);
    setError(null);
  };

  const handleSubmit = () => {
    const amount = parseAmount(amountText);
    const validationError = validateSettlement(group, balances, { fromMemberId: fromId, toMemberId: toId, amount });
    setError(validationError);
    if (validationError || amount === null) return;

    addSettlement({
      groupId: group.id,
      fromMemberId: fromId,
      toMemberId: toId,
      amount,
      date: new Date().toISOString(),
    });
    showToast(`${name(fromId)} paid ${name(toId) === 'You' ? 'you' : name(toId)} ${formatCurrency(amount)}`);

    if (openedFromGroupId === group.id && router.canGoBack()) {
      router.back();
    } else {
      router.replace({ pathname: '/groups/[id]', params: { id: group.id } });
    }
  };

  const amountHint =
    fromId === toId
      ? undefined
      : maxAmount > 0
        ? `${name(fromId)} can pay up to ${formatCurrency(maxAmount)}`
        : `${name(fromId)} doesn’t owe ${name(toId) === 'You' ? 'you' : name(toId)} anything`;

  return (
    <FormScreen
      header={<ScreenHeader title="Settle up" showBack />}
      footer={<AppButton title="Record settlement" size="lg" onPress={handleSubmit} />}
    >
      {groups.length > 1 && (
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
      )}

      <FormField label="Outstanding balances">
        {suggestions.length === 0 ? (
          <AppCard style={styles.settled}>
            <CircleCheck size={20} color={colors.positive} />
            <Text style={styles.settledText}>Everyone in {group.name} is settled up.</Text>
          </AppCard>
        ) : (
          <AppCard flush>
            {suggestions.map((s, index) => {
              const isSelected = s.fromMemberId === fromId && s.toMemberId === toId;
              return (
                <Fragment key={`${s.fromMemberId}-${s.toMemberId}`}>
                  {index > 0 && <View style={styles.divider} />}
                  <Pressable
                    onPress={() => applySuggestion(s)}
                    accessibilityRole="button"
                    accessibilityLabel={`${name(s.fromMemberId)} pays ${name(s.toMemberId)} ${formatCurrency(s.amount)}`}
                    style={({ pressed }) => [styles.suggestion, isSelected && styles.suggestionSelected, pressed && styles.pressed]}
                  >
                    <Avatar id={s.fromMemberId} name={group.members.find((m) => m.id === s.fromMemberId)?.name ?? '?'} size={30} />
                    <ArrowRight size={14} color={colors.textMuted} />
                    <Avatar id={s.toMemberId} name={group.members.find((m) => m.id === s.toMemberId)?.name ?? '?'} size={30} />
                    <Text style={styles.suggestionText} numberOfLines={1}>
                      {name(s.fromMemberId)} → {name(s.toMemberId)}
                    </Text>
                    <Text style={styles.suggestionAmount}>{formatCurrency(s.amount)}</Text>
                  </Pressable>
                </Fragment>
              );
            })}
          </AppCard>
        )}
      </FormField>

      <FormField label="Who paid?">
        <HorizontalChips>
          {group.members.map((member) => (
            <Chip
              key={member.id}
              label={name(member.id)}
              selected={fromId === member.id}
              onPress={() => {
                setFromId(member.id);
                setError(null);
              }}
              leading={<Avatar id={member.id} name={member.name} size={22} />}
            />
          ))}
        </HorizontalChips>
      </FormField>

      <FormField label="Who received it?">
        <HorizontalChips>
          {group.members.map((member) => (
            <Chip
              key={member.id}
              label={name(member.id)}
              selected={toId === member.id}
              onPress={() => {
                setToId(member.id);
                setError(null);
              }}
              leading={<Avatar id={member.id} name={member.name} size={22} />}
            />
          ))}
        </HorizontalChips>
      </FormField>

      <AppInput
        label="Amount"
        prefix="₹"
        placeholder="0"
        value={amountText}
        onChangeText={(text) => {
          setAmountText(sanitizeAmountInput(text));
          setError(null);
        }}
        keyboardType="decimal-pad"
        error={error ?? undefined}
        hint={amountHint}
        right={
          maxAmount > 0 ? (
            <Pressable
              onPress={() => setAmountText(amountToInput(maxAmount))}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Use full outstanding amount"
              style={({ pressed }) => [styles.maxButton, pressed && styles.pressed]}
            >
              <Text style={styles.maxText}>Max</Text>
            </Pressable>
          ) : null
        }
      />

      <View style={styles.note}>
        <Info size={16} color={colors.textSecondary} />
        <Text style={styles.noteText}>
          This only records that a payment happened. No money is transferred through SplitEase.
        </Text>
      </View>
    </FormScreen>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  settled: {
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
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  suggestionSelected: {
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.7,
  },
  suggestionText: {
    ...typography.bodyMedium,
    color: colors.text,
    flex: 1,
    marginLeft: spacing.xs,
  },
  suggestionAmount: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },
  maxButton: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  maxText: {
    ...typography.tiny,
    color: colors.primary,
  },
  note: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.divider,
  },
  noteText: {
    ...typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
});
