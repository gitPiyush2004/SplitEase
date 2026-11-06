import { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { SCREEN_PADDING, spacing } from '@/constants/theme';

/** A horizontally scrolling row of chips that bleeds to the screen edges. */
export function HorizontalChips({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginHorizontal: -SCREEN_PADDING,
  },
  row: {
    gap: spacing.sm,
    paddingHorizontal: SCREEN_PADDING,
  },
});
