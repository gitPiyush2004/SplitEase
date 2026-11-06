import Constants from 'expo-constants';
import { ChevronRight, IndianRupee, LucideIcon, Mail, Pencil, RotateCcw, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { AppInput } from '@/components/common/AppInput';
import { Avatar } from '@/components/common/Avatar';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { useToast } from '@/components/common/Toast';
import { colors, radius, SCREEN_PADDING, spacing, typography } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { CURRENT_USER_ID } from '@/types';
import { confirmAction } from '@/utils/navigation';
import { isValidEmail } from '@/utils/validation';

export default function ProfileScreen() {
  const { profile, groups, expenses, settlements, updateProfile, resetDemoData } = useApp();
  const showToast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const startEditing = () => {
    setName(profile.name);
    setEmail(profile.email);
    setErrors({});
    setIsEditing(true);
  };

  const saveProfile = () => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = 'Name cannot be empty.';
    if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    updateProfile({ name, email });
    setIsEditing(false);
    showToast('Profile updated');
  };

  const handleReset = async () => {
    const confirmed = await confirmAction({
      title: 'Reset demo data?',
      message: 'All your groups, expenses and settlements will be replaced with the original demo data.',
      confirmText: 'Reset',
      destructive: true,
    });
    if (confirmed) {
      resetDemoData();
      setIsEditing(false);
      showToast('Demo data restored');
    }
  };

  const stats = [
    { label: 'Groups', value: groups.length },
    { label: 'Expenses', value: expenses.length },
    { label: 'Settlements', value: settlements.length },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <KeyboardAvoidingView behavior="padding" style={styles.screen}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader title="Profile" />

          <View style={styles.body}>
            {/* Identity */}
            <AppCard style={styles.identity}>
              <Avatar id={CURRENT_USER_ID} name={profile.name} size={76} />
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.email}>{profile.email}</Text>

              <View style={styles.stats}>
                {stats.map((stat, index) => (
                  <View key={stat.label} style={[styles.stat, index > 0 && styles.statBorder]}>
                    <Text style={styles.statValue}>{stat.value}</Text>
                    <Text style={styles.statLabel}>{stat.label}</Text>
                  </View>
                ))}
              </View>
            </AppCard>

            {/* Account */}
            <Text style={styles.sectionLabel}>Account</Text>
            {isEditing ? (
              <AppCard style={styles.editCard}>
                <AppInput
                  label="Name"
                  value={name}
                  onChangeText={setName}
                  error={errors.name}
                  autoCapitalize="words"
                  maxLength={40}
                />
                <AppInput
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  error={errors.email}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.editActions}>
                  <AppButton title="Cancel" variant="outline" onPress={() => setIsEditing(false)} style={styles.flex} />
                  <AppButton title="Save" onPress={saveProfile} style={styles.flex} />
                </View>
              </AppCard>
            ) : (
              <AppCard flush>
                <SettingsRow icon={UserRound} label="Name" value={profile.name} onPress={startEditing} />
                <View style={styles.divider} />
                <SettingsRow icon={Mail} label="Email" value={profile.email} onPress={startEditing} />
              </AppCard>
            )}

            {/* Preferences */}
            <Text style={styles.sectionLabel}>Preferences</Text>
            <AppCard flush>
              <SettingsRow icon={IndianRupee} label="Currency" value="Indian Rupee (₹)" />
            </AppCard>

            {/* Data */}
            <Text style={styles.sectionLabel}>Data</Text>
            <AppCard flush>
              <SettingsRow icon={RotateCcw} label="Reset demo data" onPress={handleReset} destructive />
            </AppCard>

            <Text style={styles.footer}>
              SplitEase v{Constants.expoConfig?.version ?? '1.0.0'} · Every expense, fairly split.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface SettingsRowProps {
  icon: LucideIcon;
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
}

function SettingsRow({ icon: Icon, label, value, onPress, destructive }: SettingsRowProps) {
  const tint = destructive ? colors.negative : colors.primary;
  const content = (
    <>
      <View style={[styles.rowIcon, { backgroundColor: destructive ? colors.negativeSoft : colors.primarySoft }]}>
        <Icon size={18} color={tint} strokeWidth={2} />
      </View>
      <View style={styles.flex}>
        <Text style={[styles.rowLabel, destructive && { color: colors.negative }]}>{label}</Text>
        {value && (
          <Text style={styles.rowValue} numberOfLines={1}>
            {value}
          </Text>
        )}
      </View>
      {onPress &&
        (destructive ? (
          <ChevronRight size={18} color={colors.textMuted} />
        ) : (
          <Pencil size={16} color={colors.textMuted} />
        ))}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  body: {
    paddingHorizontal: SCREEN_PADDING,
  },
  flex: {
    flex: 1,
  },
  identity: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  name: {
    ...typography.h2,
    color: colors.text,
    marginTop: spacing.md,
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    marginTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  statBorder: {
    borderLeftWidth: 1,
    borderLeftColor: colors.divider,
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  editCard: {
    gap: spacing.lg,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
  },
  rowPressed: {
    backgroundColor: colors.background,
    borderRadius: radius.xl,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  rowValue: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg + 36 + spacing.md,
  },
  footer: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
});
