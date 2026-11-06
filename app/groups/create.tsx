import { router } from 'expo-router';
import { UserPlus, X } from 'lucide-react-native';
import { Fragment, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/common/AppButton';
import { AppCard } from '@/components/common/AppCard';
import { AppInput } from '@/components/common/AppInput';
import { Avatar } from '@/components/common/Avatar';
import { Chip } from '@/components/common/Chip';
import { FormField } from '@/components/common/FormField';
import { FormScreen } from '@/components/common/FormScreen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { useToast } from '@/components/common/Toast';
import { GROUP_CATEGORIES } from '@/constants/categories';
import { colors, radius, spacing, typography } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { CURRENT_USER_ID, GroupCategory } from '@/types';
import { generateId } from '@/utils/id';
import { GroupDraftErrors, MemberDraft, validateGroupDraft, validateMemberDraft } from '@/utils/validation';

interface DraftMember extends MemberDraft {
  /** Temporary key for list rendering — real member IDs are created on save. */
  key: string;
}

export default function CreateGroupScreen() {
  const { profile, createGroup } = useApp();
  const showToast = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GroupCategory>('trip');
  const [members, setMembers] = useState<DraftMember[]>([]);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberError, setMemberError] = useState<string | null>(null);
  const [errors, setErrors] = useState<GroupDraftErrors>({});

  const existingNames = [profile.name, 'You', ...members.map((m) => m.name)];

  /** Validates the "add member" inputs. Returns the new member, or null if invalid. */
  const buildPendingMember = (): DraftMember | null => {
    const draft = { name: memberName, email: memberEmail };
    const error = validateMemberDraft(draft, existingNames);
    setMemberError(error);
    if (error) return null;
    return { key: generateId('draft'), name: memberName.trim(), email: memberEmail.trim() };
  };

  const addMember = () => {
    const member = buildPendingMember();
    if (!member) return;
    setMembers((current) => [...current, member]);
    setMemberName('');
    setMemberEmail('');
    setErrors((current) => ({ ...current, members: undefined }));
  };

  const removeMember = (key: string) => {
    setMembers((current) => current.filter((m) => m.key !== key));
  };

  const handleSubmit = () => {
    // If a name was typed but "Add" wasn't tapped, include that person too.
    let finalMembers = members;
    if (memberName.trim() || memberEmail.trim()) {
      const pending = buildPendingMember();
      if (!pending) return;
      finalMembers = [...members, pending];
    }

    const validation = validateGroupDraft(name, finalMembers, profile.name);
    setErrors(validation);
    if (validation.name || validation.members) return;

    const group = createGroup({ name, description, category, members: finalMembers });
    showToast(`${group.name} created`);
    router.replace({ pathname: '/groups/[id]', params: { id: group.id } });
  };

  return (
    <FormScreen
      header={<ScreenHeader title="New group" showBack />}
      footer={<AppButton title="Create group" size="lg" onPress={handleSubmit} />}
    >
      <AppInput
        label="Group name"
        placeholder="e.g. Goa Trip"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (errors.name) setErrors((current) => ({ ...current, name: undefined }));
        }}
        error={errors.name}
        maxLength={40}
        autoCapitalize="words"
      />

      <AppInput
        label="Description (optional)"
        placeholder="What's this group for?"
        value={description}
        onChangeText={setDescription}
        maxLength={80}
      />

      <FormField label="Category">
        <View style={styles.chips}>
          {GROUP_CATEGORIES.map((item) => (
            <Chip
              key={item.key}
              label={item.label}
              icon={item.icon}
              selected={category === item.key}
              onPress={() => setCategory(item.key)}
            />
          ))}
        </View>
      </FormField>

      <FormField
        label="Members"
        aside={<Text style={styles.count}>{members.length + 1} {members.length === 0 ? 'person' : 'people'}</Text>}
        error={errors.members}
      >
        <AppCard flush>
          <View style={styles.memberRow}>
            <Avatar id={CURRENT_USER_ID} name={profile.name} size={36} />
            <View style={styles.flex}>
              <Text style={styles.memberName}>{profile.name}</Text>
              <Text style={styles.memberEmail}>{profile.email}</Text>
            </View>
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>You</Text>
            </View>
          </View>

          {members.map((member) => (
            <Fragment key={member.key}>
              <View style={styles.divider} />
              <View style={styles.memberRow}>
                <Avatar id={member.key} name={member.name} size={36} />
                <View style={styles.flex}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  {!!member.email && <Text style={styles.memberEmail}>{member.email}</Text>}
                </View>
                <Pressable
                  onPress={() => removeMember(member.key)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${member.name}`}
                  style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
                >
                  <X size={16} color={colors.textSecondary} />
                </Pressable>
              </View>
            </Fragment>
          ))}
        </AppCard>
      </FormField>

      <FormField label="Add a member">
        <View style={styles.addMember}>
          <AppInput
            placeholder="Name"
            value={memberName}
            onChangeText={(text) => {
              setMemberName(text);
              if (memberError) setMemberError(null);
            }}
            autoCapitalize="words"
            maxLength={40}
            returnKeyType="next"
          />
          <AppInput
            placeholder="Email (optional)"
            value={memberEmail}
            onChangeText={(text) => {
              setMemberEmail(text);
              if (memberError) setMemberError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={addMember}
            error={memberError ?? undefined}
          />
          <AppButton title="Add member" icon={UserPlus} variant="secondary" onPress={addMember} />
        </View>
      </FormField>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  count: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  memberName: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  memberEmail: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  youBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  youBadgeText: {
    ...typography.tiny,
    color: colors.primary,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: spacing.lg + 36 + spacing.md,
  },
  addMember: {
    gap: spacing.sm,
  },
});
