import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/constants/theme';

interface FormFieldProps {
  label: string;
  /** Small text shown to the right of the label. */
  aside?: ReactNode;
  error?: string;
  children: ReactNode;
}

/** A labelled block in a form (for chips, pickers and custom inputs). */
export function FormField({ label, aside, error, children }: FormFieldProps) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {aside}
      </View>
      {children}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.captionMedium,
    color: colors.text,
  },
  error: {
    ...typography.caption,
    color: colors.negative,
    marginTop: spacing.sm,
  },
});
