import { router } from 'expo-router';
import { LucideIcon, Receipt, UserPlus } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '@/constants/theme';

export function QuickActions() {
  return (
    <View style={styles.row}>
      <QuickAction
        icon={UserPlus}
        title="Create group"
        caption="Split with friends"
        onPress={() => router.push('/groups/create')}
      />
      <QuickAction
        icon={Receipt}
        title="Add expense"
        caption="Record a bill"
        onPress={() => router.push('/expenses/create')}
      />
    </View>
  );
}

interface QuickActionProps {
  icon: LucideIcon;
  title: string;
  caption: string;
  onPress: () => void;
}

function QuickAction({ icon: Icon, title, caption, onPress }: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Icon size={20} color={colors.primary} strokeWidth={2.2} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.caption}>{caption}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  action: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.bodySemibold,
    color: colors.text,
  },
  caption: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
