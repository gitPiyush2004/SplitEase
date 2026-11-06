/**
 * Generates a reasonably unique ID such as "exp_lq3k9z_8f2a1c".
 * Good enough for local data; a real backend would issue IDs itself.
 */
export function generateId(prefix: string): string {
  const time = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${time}_${random}`;
}
