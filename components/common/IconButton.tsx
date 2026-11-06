import { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet } from 'react-native';

import { colors } from '@/constants/theme';

interface IconButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
  variant?: 'outline' | 'filled';
  size?: number;
}

/** Round icon-only button, used in headers. */
export function IconButton({
  icon: Icon,
  onPress,
  accessibilityLabel,
  color = colors.text,
  variant = 'outline',
  size = 40,
}: IconButtonProps) {
  const filled = variant === 'filled';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        filled ? styles.filled : styles.outline,
        pressed && styles.pressed,
      ]}
    >
      <Icon size={size * 0.48} color={filled ? colors.white : color} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filled: {
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});
