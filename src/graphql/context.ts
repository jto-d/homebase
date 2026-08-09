/**
 * The GraphQL context and its auth gate.
 *
 * The context is nullable rather than throwing, because `householdInvitePreview`
 * must be reachable anonymously. `requireAuth` throws at the resolver instead.
 *
 * Invariant: every resolver except `householdInvitePreview` calls `requireAuth`,
 * and every Prisma query scopes by the `householdId` it returns — never `userId`,
 * which would break sharing between members.
 */
import { UserFacingError } from '@/lib/errors'

export interface Context {
  userId: string | null
  householdId: string | null
}

export interface AuthedContext {
  userId: string
  householdId: string
}

export function requireAuth(ctx: Context): AuthedContext {
  if (!ctx.userId || !ctx.householdId) throw new UserFacingError('Unauthorized')
  return { userId: ctx.userId, householdId: ctx.householdId }
}
