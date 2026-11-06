const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/** Lower-cased, single-spaced name used for duplicate checks. */
export function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export interface MemberDraft {
  name: string;
  email: string;
}

/**
 * Validates a member before adding them to a new group.
 * `existingNames` should include the current user's name.
 */
export function validateMemberDraft(draft: MemberDraft, existingNames: string[]): string | null {
  const name = draft.name.trim();
  if (!name) {
    return 'Enter a name for this member.';
  }
  if (name.length > 40) {
    return 'Names can be at most 40 characters.';
  }
  if (existingNames.some((existing) => normalizeName(existing) === normalizeName(name))) {
    return `${name} is already in this group.`;
  }
  if (draft.email.trim() && !isValidEmail(draft.email)) {
    return 'That email address doesn’t look right.';
  }
  return null;
}

export interface GroupDraftErrors {
  name?: string;
  members?: string;
}

/** Validates the Create Group form before saving. */
export function validateGroupDraft(
  groupName: string,
  members: MemberDraft[],
  currentUserName: string,
): GroupDraftErrors {
  const errors: GroupDraftErrors = {};

  if (!groupName.trim()) {
    errors.name = 'Give your group a name.';
  } else if (groupName.trim().length > 40) {
    errors.name = 'Group names can be at most 40 characters.';
  }

  if (members.length === 0) {
    errors.members = 'Add at least one other member.';
  } else if (members.some((m) => !m.name.trim())) {
    errors.members = 'Member names cannot be empty.';
  } else {
    const names = [currentUserName, ...members.map((m) => m.name)].map(normalizeName);
    if (new Set(names).size !== names.length) {
      errors.members = 'Each member needs a unique name.';
    }
  }

  return errors;
}
