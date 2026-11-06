import { ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, shadows, spacing, typography } from '@/constants/theme';
import { BalanceSummary } from '@/utils/balanceCalculator';
import { formatCurrency } from '@/utils/formatCurrency';
import { toPaise } from '@/utils/money';

interface BalanceCardProps {
  summary: BalanceSummary;
}

function getNetCaption(net: number): { text: string; dot: string } {
  const paise = toPaise(net);
  if (paise > 0) return { text: 'You’re owed overall', dot: '#5BE3A6' };
  if (paise < 0) return { text: 'You owe overall', dot: '#FF9AA0' };
  return { text: 'All settled up', dot: colors.white };
}

/** The dashboard hero card: net balance plus what you owe / are owed. */
export function BalanceCard({ summary }: BalanceCardProps) {
  const caption = getNetCaption(summary.net);

  return (
    <View style={styles.card}>
      {/* Decorative circles */}
      <View style={[styles.circle, styles.circleLarge]} />
      <View style={[styles.circle, styles.circleSmall]} />

      <View style={styles.topRow}>
        <Text style={styles.label}>Net balance</Text>
        <View style={styles.pill}>
          <View style={[styles.dot, { backgroundColor: caption.dot }]} />
          <Text style={styles.pillText}>{caption.text}</Text>
        </View>
      </View>

      <Text style={styles.net} adjustsFontSizeToFit numberOfLines={1}>
        {formatCurrency(summary.net, { showPlus: true })}
      </Text>

      <View style={styles.tiles}>
        <BalanceTile
          label="You’re owed"
          amount={summary.youAreOwed}
          icon={<ArrowDownLeft size={16} color={colors.positive} strokeWidth={2.5} />}
          iconBackground={colors.positiveSoft}
        />
        <View style={styles.tileDivider} />
        <BalanceTile
          label="You owe"
          amount={summary.youOwe}
          icon={<ArrowUpRight size={16} color={colors.negative} strokeWidth={2.5} />}
          iconBackground={colors.negativeSoft}
        />
      </View>
    </View>
  );
}

interface BalanceTileProps {
  label: string;
  amount: number;
  icon: ReactNode;
  iconBackground: string;
}

function BalanceTile({ label, amount, icon, iconBackground }: BalanceTileProps) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: iconBackground }]}>{icon}</View>
      <View style={styles.tileText}>
        <Text style={styles.tileLabel}>{label}</Text>
        <Text style={styles.tileAmount} numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(amount)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    overflow: 'hidden',
    ...shadows.raised,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  circleLarge: {
    width: 220,
    height: 220,
    top: -90,
    right: -60,
  },
  circleSmall: {
    width: 120,
    height: 120,
    top: 40,
    right: 70,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...typography.captionMedium,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pillText: {
    ...typography.tiny,
    color: colors.white,
  },
  net: {
    fontFamily: fonts.bold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -1.2,
    color: colors.white,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  tiles: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.md + 2,
  },
  tile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  tileDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  tileIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    flex: 1,
  },
  tileLabel: {
    ...typography.tiny,
    color: colors.textSecondary,
  },
  tileAmount: {
    ...typography.bodySemibold,
    fontSize: 16,
    color: colors.text,
    marginTop: 1,
  },
});
