import { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { radius } from '@/constants/theme';

interface CategoryIconProps {
  icon: LucideIcon;
  color: string;
  background: string;
  size?: number;
}

/** A tinted rounded square holding an icon. */
export function CategoryIcon({ icon: Icon, color, background, size = 44 }: CategoryIconProps) {
  return (
    <View
      style={[
        styles.container,
        { width: size, height: size, backgroundColor: background, borderRadius: size > 48 ? radius.lg : radius.md },
      ]}
    >
      <Icon size={size * 0.46} color={color} strokeWidth={2} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
