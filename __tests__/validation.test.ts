import { validateGroupDraft, validateMemberDraft } from '@/utils/validation';

describe('validateMemberDraft', () => {
  const existing = ['Piyush Bhatia', 'Rahul Sharma'];

  it('accepts a new member with or without email', () => {
    expect(validateMemberDraft({ name: 'Aman', email: '' }, existing)).toBeNull();
    expect(validateMemberDraft({ name: 'Aman', email: 'aman@example.com' }, existing)).toBeNull();
  });

  it('rejects empty names, duplicates and bad emails', () => {
    expect(validateMemberDraft({ name: '   ', email: '' }, existing)).not.toBeNull();
    expect(validateMemberDraft({ name: ' rahul  sharma ', email: '' }, existing)).not.toBeNull();
    expect(validateMemberDraft({ name: 'Aman', email: 'aman@' }, existing)).not.toBeNull();
  });
});

describe('validateGroupDraft', () => {
  it('requires a name and at least one other member', () => {
    expect(validateGroupDraft('', [], 'Piyush')).toEqual({
      name: expect.any(String),
      members: expect.any(String),
    });
  });

  it('rejects duplicate member names', () => {
    const errors = validateGroupDraft('Trip', [{ name: 'Piyush', email: '' }], 'piyush');
    expect(errors.members).toBeDefined();
  });

  it('accepts a valid group', () => {
    expect(validateGroupDraft('Trip', [{ name: 'Rahul', email: '' }], 'Piyush')).toEqual({});
  });
});
