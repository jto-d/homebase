/**
 * Per-member visual identity — the basis for every "whose is whose" badge in
 * the app (card ownership tags, budget attribution, split rows, …).
 *
 * The palette is a small fixed list rather than random generation so a
 * household looks the same as every other household: the member who created
 * the household is always the first hue, the partner always the second. The
 * DB stores the slug; hex lives here. That slug-in-DB → registry-in-code split
 * is the same pattern the app uses for other visual identities.
 *
 * Everything in this file is pure — it is unit tested.
 */

export const MEMBER_COLORS = ['teal', 'amber'] as const

export type MemberColor = (typeof MEMBER_COLORS)[number]

export const MEMBER_COLOR_HEX: Record<MemberColor, string> = {
  teal: '#119290',
  amber: '#B45309',
}

/**
 * The color a joining member should get, given the colors already in use by
 * the household. Falls back to the first hue if somehow every slot is taken —
 * a duplicate color is a cosmetic problem, not a reason to fail a join.
 */
export function nextMemberColor(taken: readonly string[]): MemberColor {
  return MEMBER_COLORS.find((color) => !taken.includes(color)) ?? MEMBER_COLORS[0]
}

/** Resolve a stored slug to hex, tolerating anything unexpected in the column. */
export function memberColorHex(color: string): string {
  return MEMBER_COLOR_HEX[color as MemberColor] ?? MEMBER_COLOR_HEX.teal
}

/**
 * Display name for a member. Google usually supplies a name, but the column is
 * nullable, so fall back to the email local part before ever showing a raw
 * address in the UI.
 */
export function memberLabel(user: { name?: string | null; email: string }): string {
  return user.name?.trim() || user.email.split('@')[0]
}

/** Single letter for the member avatar. */
export function memberInitial(user: { name?: string | null; email: string }): string {
  return (memberLabel(user)[0] ?? '?').toUpperCase()
}
