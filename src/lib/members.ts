/**
 * Per-member visual identity — the basis for every "whose is whose" badge.
 *
 * Fixed palette, not random, so every household looks the same: creator gets the
 * first hue, partner the second. The DB stores the slug; hex lives here.
 */

export const MEMBER_COLORS = ['teal', 'amber'] as const

export type MemberColor = (typeof MEMBER_COLORS)[number]

export const MEMBER_COLOR_HEX: Record<MemberColor, string> = {
  teal: '#119290',
  amber: '#B45309',
}

/**
 * The color a joining member gets. Falls back to the first hue if every slot is
 * taken — a duplicate color is cosmetic, not a reason to fail a join.
 */
export function nextMemberColor(taken: readonly string[]): MemberColor {
  return MEMBER_COLORS.find((color) => !taken.includes(color)) ?? MEMBER_COLORS[0]
}

/** Resolve a stored slug to hex, tolerating anything unexpected in the column. */
export function memberColorHex(color: string): string {
  return MEMBER_COLOR_HEX[color as MemberColor] ?? MEMBER_COLOR_HEX.teal
}

/** Display name. `name` is nullable, so fall back to the email local part rather than show a raw address. */
export function memberLabel(user: { name?: string | null; email: string }): string {
  return user.name?.trim() || user.email.split('@')[0]
}

/** Single letter for the member avatar. */
export function memberInitial(user: { name?: string | null; email: string }): string {
  return (memberLabel(user)[0] ?? '?').toUpperCase()
}
