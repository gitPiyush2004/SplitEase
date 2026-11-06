import { router } from 'expo-router';
import { Bell, Inbox, TriangleAlert, UsersRound } from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/common/AppCard';
import { Avatar } from '@/components/common/Avatar';
import { EmptyState } from '@/components/common/EmptyState';
import { IconButton } from '@/components/common/IconButton';
import { SectionHeader } from '@/components/common/SectionHeader';
import { useToast } from '@/components/common/Toast';
import { ActivityList } from '@/components/expenses/ActivityList';
import { GroupCard } from '@/components/groups/GroupCard';
import { BalanceCard } from '@/components/home/BalanceCard';
import { QuickActions } from '@/components/home/QuickActions';
import { colors, radius, SCREEN_PADDING, spacing, typography } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useGroupSummaries } from '@/hooks/useGroupSummaries';
import { CURRENT_USER_ID } from '@/types';
import { buildActivityFeed } from '@/utils/activity';
import { calculateUserBalanceSummary } from '@/utils/balanceCalculator';
import { getGreeting } from '@/utils/date';

const MAX_GROUPS = 3;
const MAX_ACTIVITY = 4;

export default function HomeScreen() {
  const { profile, groups, expenses, settlements, storageError } = useApp();
  const groupSummaries = useGroupSummaries();
  const showToast = useToast();

  // Balances are always derived from stored expenses and settlements — never hardcoded.
  const summary = useMemo(
    () => calculateUserBalanceSummary(groups, expenses, settlements),
    [groups, expenses, settlements],
  );
  const recentActivity = useMemo(
    () => buildActivityFeed(groups, expenses, settlements).slice(0, MAX_ACTIVITY),
    [groups, expenses, settlements],
  );

  const firstName = profile.name.split(' ')[0] || 'there';

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <Avatar id={CURRENT_USER_ID} name={profile.name} size={46} />
          </Pressable>
          <View style={styles.greeting}>
            <Text style={styles.greetingTitle} numberOfLines={1}>
              {getGreeting()}, {firstName}
            </Text>
            <Text style={styles.greetingSubtitle}>Here’s your expense overview.</Text>
          </View>
          <IconButton
            icon={Bell}
            accessibilityLabel="Notifications"
            onPress={() => showToast('You’re all caught up')}
          />
        </View>

        {storageError && (
          <View style={styles.warning}>
            <TriangleAlert size={18} color={colors.warning} />
            <Text style={styles.warningText}>{storageError}</Text>
          </View>
        )}

        <BalanceCard summary={summary} />

        <QuickActions />

        {/* Groups */}
        <View>
          <SectionHeader
            title="Your groups"
            actionLabel={groups.length > 0 ? 'See all' : undefined}
            onAction={() => router.push('/groups')}
          />
          {groupSummaries.length === 0 ? (
            <AppCard>
              <EmptyState
                compact
                icon={UsersRound}
                title="No groups yet"
                message="Create a group for your next trip, flat or dinner plan."
                actionLabel="Create a group"
                onAction={() => router.push('/groups/create')}
              />
            </AppCard>
          ) : (
            <View style={styles.list}>
              {groupSummaries.slice(0, MAX_GROUPS).map((item) => (
                <GroupCard key={item.group.id} {...item} />
              ))}
            </View>
          )}
        </View>

        {/* Recent activity */}
        <View>
          <SectionHeader
            title="Recent activity"
            actionLabel={recentActivity.length > 0 ? 'See all' : undefined}
            onAction={() => router.push('/activity')}
          />
          {recentActivity.length === 0 ? (
            <AppCard>
              <EmptyState
                compact
                icon={Inbox}
                title="Nothing here yet"
                message="Expenses and settlements you add will show up here."
              />
            </AppCard>
          ) : (
            <ActivityList items={recentActivity} showGroup />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  greeting: {
    flex: 1,
  },
  greetingTitle: {
    ...typography.h3,
    color: colors.text,
  },
  greetingSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.warningSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  warningText: {
    ...typography.caption,
    color: colors.text,
    flex: 1,
  },
  list: {
    gap: spacing.md,
  },
});
