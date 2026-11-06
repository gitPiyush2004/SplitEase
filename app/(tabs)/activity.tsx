import { Inbox } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/common/EmptyState';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { SegmentedControl } from '@/components/common/SegmentedControl';
import { ActivityList } from '@/components/expenses/ActivityList';
import { colors, SCREEN_PADDING, spacing, typography } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { ActivityItem } from '@/types';
import { buildActivityFeed } from '@/utils/activity';
import { formatRelativeDay } from '@/utils/date';

type Filter = 'all' | 'expense' | 'settlement';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'expense', label: 'Expenses' },
  { value: 'settlement', label: 'Settlements' },
];

interface DaySection {
  title: string;
  items: ActivityItem[];
}

/** Groups an already-sorted feed into "Today", "Yesterday", "3 Nov", … */
function groupByDay(items: ActivityItem[]): DaySection[] {
  const sections: DaySection[] = [];
  items.forEach((item) => {
    const title = formatRelativeDay(item.date);
    const last = sections[sections.length - 1];
    if (last && last.title === title) {
      last.items.push(item);
    } else {
      sections.push({ title, items: [item] });
    }
  });
  return sections;
}

export default function ActivityScreen() {
  const { groups, expenses, settlements } = useApp();
  const [filter, setFilter] = useState<Filter>('all');

  const sections = useMemo(() => {
    const feed = buildActivityFeed(groups, expenses, settlements);
    const filtered = filter === 'all' ? feed : feed.filter((item) => item.type === filter);
    return groupByDay(filtered);
  }, [groups, expenses, settlements, filter]);

  const emptyMessage =
    filter === 'settlement'
      ? 'When someone pays back a debt, record it with Settle Up and it will appear here.'
      : 'Add an expense to a group and it will appear here.';

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScreenHeader title="Activity" subtitle="Expenses and settlements across all groups" />
      <View style={styles.filters}>
        <SegmentedControl options={FILTERS} value={filter} onChange={setFilter} />
      </View>

      <FlatList
        data={sections}
        keyExtractor={(section) => section.title}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: section }) => (
          <View>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <ActivityList items={section.items} showGroup showDate={false} />
          </View>
        )}
        ListEmptyComponent={<EmptyState icon={Inbox} title="No activity yet" message={emptyMessage} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filters: {
    paddingHorizontal: SCREEN_PADDING,
    marginBottom: spacing.sm,
  },
  list: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
});
