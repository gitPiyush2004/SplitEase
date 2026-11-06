import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

/** Shown while saved data is restored from storage. */
export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logo}>
        <Text style={styles.logoText}>S</Text>
      </View>
      <ActivityIndicator color={colors.primary} style={styles.spinner} />
      <Text style={styles.caption}>Loading your expenses…</Text>
    </View>
  );
}

// Fonts may still be loading here, so this screen uses system fonts.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '700',
  },
  spinner: {
    marginTop: spacing.xxl,
  },
  caption: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 14,
  },
});
