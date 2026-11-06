import { router } from 'expo-router';
import { Plus, Search, UsersRound, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppInput } from '@/components/common/AppInput';
import { EmptyState } from '@/components/common/EmptyState';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { GroupCard } from '@/components/groups/GroupCard';
import { getGroupCategory } from '@/constants/categories';
import { colors, radius, SCREEN_PADDING, shadows, spacing } from '@/constants/theme';
import { useGroupSummaries } from '@/hooks/useGroupSummaries';

export default function GroupsScreen() {
  const summaries = useGroupSummaries();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return summaries;
    return summaries.filter(({ group }) =>
      [group.name, group.description, getGroupCategory(group.category).label]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [summaries, query]);

  const openCreate = () => router.push('/groups/create');
  const hasGroups = summaries.length > 0;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScreenHeader
        title="Groups"
        subtitle={hasGroups ? `${summaries.length} active ${summaries.length === 1 ? 'group' : 'groups'}` : undefined}
      />

      {hasGroups && (
        <View style={styles.searchWrap}>
          <AppInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search groups"
            returnKeyType="search"
            autoCorrect={false}
            right={
              query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                  <X size={18} color={colors.textSecondary} />
                </Pressable>
              ) : (
                <Search size={18} color={colors.textMuted} />
              )
            }
          />
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.group.id}
        renderItem={({ item }) => <GroupCard {...item} />}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          hasGroups ? (
            <EmptyState
              icon={Search}
              title="No matching groups"
              message={`Nothing matches “${query.trim()}”. Try a different name.`}
            />
          ) : (
            <EmptyState
              icon={UsersRound}
              title="Start your first group"
              message="Groups keep shared expenses for a trip, a flat or a night out in one place."
              actionLabel="Create a group"
              onAction={openCreate}
            />
          )
        }
      />

      {hasGroups && (
        <Pressable
          onPress={openCreate}
          accessibilityRole="button"
          accessibilityLabel="Create group"
          style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        >
          <Plus size={26} color={colors.white} strokeWidth={2.4} />
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchWrap: {
    paddingHorizontal: SCREEN_PADDING,
    marginBottom: spacing.lg,
  },
  list: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: 100,
    gap: spacing.md,
  },
  fab: {
    position: 'absolute',
    right: SCREEN_PADDING,
    bottom: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.raised,
  },
  fabPressed: {
    transform: [{ scale: 0.94 }],
    backgroundColor: colors.primaryDark,
  },
});
