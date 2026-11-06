import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, SCREEN_PADDING, spacing, typography } from '@/constants/theme';

import { IconButton } from './IconButton';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Show a back button (for stack screens). */
  showBack?: boolean;
  right?: ReactNode;
}

/** Go back, or to Home if there is no screen to go back to (e.g. after a deep link). */
export function goBackOrHome() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

export function ScreenHeader({ title, subtitle, showBack = false, right }: ScreenHeaderProps) {
  if (showBack) {
    return (
      <View style={styles.compact}>
        <IconButton icon={ArrowLeft} onPress={goBackOrHome} accessibilityLabel="Go back" />
        <Text style={styles.compactTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.side}>{right}</View>
      </View>
    );
  }

  return (
    <View style={styles.large}>
      <View style={styles.titles}>
        <Text style={styles.largeTitle}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  compactTitle: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  side: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  large: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  titles: {
    flex: 1,
  },
  largeTitle: {
    ...typography.h1,
    color: colors.text,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
});
