import { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger';
type Size = 'md' | 'lg';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const VARIANTS: Record<Variant, { background: string; text: string; border: string }> = {
  primary: { background: colors.primary, text: colors.white, border: colors.primary },
  secondary: { background: colors.primarySoft, text: colors.primary, border: colors.primarySoft },
  outline: { background: colors.card, text: colors.text, border: colors.border },
  danger: { background: colors.negativeSoft, text: colors.negative, border: colors.negativeSoft },
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  loading = false,
  style,
}: AppButtonProps) {
  const palette = VARIANTS[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.large : styles.medium,
        { backgroundColor: palette.background, borderColor: palette.border },
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} />
      ) : (
        <>
          {Icon && <Icon size={18} color={palette.text} strokeWidth={2.2} />}
          <Text style={[styles.text, { color: palette.text }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
  },
  medium: {
    height: 46,
  },
  large: {
    height: 54,
    borderRadius: radius.lg,
  },
  text: {
    ...typography.bodySemibold,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
});
