import { HandCoins } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { CategoryIcon } from '@/components/common/CategoryIcon';
import { colors } from '@/constants/theme';
import { CURRENT_USER_ID, Group, Settlement } from '@/types';
import { getMemberFirstName } from '@/utils/activity';
import { formatRelativeDay } from '@/utils/date';
import { formatCurrency } from '@/utils/formatCurrency';

import { rowStyles as styles } from './ExpenseItem';

interface SettlementItemProps {
  settlement: Settlement;
  group: Group;
  showGroup?: boolean;
  showDate?: boolean;
  onPress: () => void;
}

/** A recorded payment between two members, e.g. "Aman paid you". */
export function SettlementItem({ settlement, group, showGroup = false, showDate = true, onPress }: SettlementItemProps) {
  const from = getMemberFirstName(group, settlement.fromMemberId);
  const to = getMemberFirstName(group, settlement.toMemberId);
  const title = `${from} paid ${to === 'You' ? 'you' : to}`;

  let label = 'settlement';
  let color: string = colors.textSecondary;
  if (settlement.toMemberId === CURRENT_USER_ID) {
    label = 'you received';
    color = colors.positive;
  } else if (settlement.fromMemberId === CURRENT_USER_ID) {
    label = 'you paid';
    color = colors.negative;
  }

  const metaParts = ['Settlement'];
  if (showGroup) metaParts.push(group.name);
  if (showDate) metaParts.push(formatRelativeDay(settlement.date));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${formatCurrency(settlement.amount)}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <CategoryIcon icon={HandCoins} color={colors.positive} background={colors.positiveSoft} size={42} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {metaParts.join(' · ')}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.contextLabel, { color }]}>{label}</Text>
        <Text style={[styles.contextAmount, { color }]}>{formatCurrency(settlement.amount)}</Text>
      </View>
    </Pressable>
  );
}
