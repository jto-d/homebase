/**
 * The GraphQL context, and the auth gate every resolver but one goes through.
 *
 * Unlike a single-tenant schema, the context here cannot simply throw on a
 * missing session: `householdInvitePreview` renders the invite landing page
 * *before* the partner has signed in, so it has to be reachable anonymously.
 * The context is therefore nullable and `requireAuth` does the throwing at the
 * resolver, which keeps the gate explicit and greppable.
 *
 * The invariant to hold: **every resolver except `householdInvitePreview`
 * calls `requireAuth`, and every Prisma query is scoped by the `householdId`
 * it returns** — never by `userId`, which would break sharing between members.
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
