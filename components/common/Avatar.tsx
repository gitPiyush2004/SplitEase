import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';
import { CURRENT_USER_ID } from '@/types';

const PALETTE = [
  { background: '#E8F1FE', text: '#2F6FD0' },
  { background: '#FDEFE6', text: '#C8622A' },
  { background: '#E6F6EF', text: '#12875A' },
  { background: '#FCEBF0', text: '#C2416A' },
  { background: '#FDF4E2', text: '#B57B12' },
  { background: '#E5F6F6', text: '#0B8584' },
  { background: '#F1ECFE', text: '#7346D9' },
];

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}

/** Picks the same colour for the same ID every time. */
function colorFor(id: string) {
  if (id === CURRENT_USER_ID) {
    return { background: colors.primary, text: colors.white };
  }
  // Simple string hash — spreads similar IDs across the palette.
  const hash = id.split('').reduce((acc, char) => (acc * 37 + char.charCodeAt(0)) >>> 0, 7);
  return PALETTE[hash % PALETTE.length];
}

interface AvatarProps {
  id: string;
  name: string;
  size?: number;
  /** Adds a white ring, used when avatars overlap. */
  bordered?: boolean;
}

export function Avatar({ id, name, size = 40, bordered = false }: AvatarProps) {
  const palette = colorFor(id);
  return (
    <View
      accessibilityLabel={name}
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: palette.background,
        },
        bordered && styles.bordered,
      ]}
    >
      <Text style={[styles.initials, { color: palette.text, fontSize: size * 0.36 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

interface AvatarStackProps {
  members: { id: string; name: string }[];
  size?: number;
  max?: number;
}

/** Overlapping row of avatars, e.g. for group members. */
export function AvatarStack({ members, size = 28, max = 4 }: AvatarStackProps) {
  const visible = members.slice(0, max);
  const extra = members.length - visible.length;

  return (
    <View style={styles.stack}>
      {visible.map((member, index) => (
        <View key={member.id} style={{ marginLeft: index === 0 ? 0 : -size * 0.3 }}>
          <Avatar id={member.id} name={member.name} size={size} bordered />
        </View>
      ))}
      {extra > 0 && (
        <View
          style={[
            styles.avatar,
            styles.bordered,
            styles.extra,
            { width: size, height: size, borderRadius: size / 2, marginLeft: -size * 0.3 },
          ]}
        >
          <Text style={[styles.extraText, { fontSize: size * 0.34 }]}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bordered: {
    borderWidth: 2,
    borderColor: colors.card,
  },
  initials: {
    fontFamily: fonts.semibold,
  },
  stack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  extra: {
    backgroundColor: colors.divider,
  },
  extraText: {
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },
});
