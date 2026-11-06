import { ReactNode, useState } from 'react';
import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';

import { colors, fonts, radius, spacing, typography } from '@/constants/theme';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  /** Text shown before the value, e.g. "₹". */
  prefix?: string;
  /** Element shown inside the input on the right, e.g. a button. */
  right?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export function AppInput({
  label,
  error,
  hint,
  prefix,
  right,
  containerStyle,
  onFocus,
  onBlur,
  style,
  ...inputProps
}: AppInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.field,
          isFocused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}
      >
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          style={[styles.input, style]}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {right}
      </View>
      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    ...typography.captionMedium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  fieldFocused: {
    borderColor: colors.primary,
  },
  fieldError: {
    borderColor: colors.negative,
  },
  prefix: {
    ...typography.bodySemibold,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.negative,
    marginTop: spacing.xs + 2,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs + 2,
  },
});
