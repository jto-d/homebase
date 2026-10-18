/**
 * The auth gate for server components and server actions — v2's counterpart to
 * `requireAuth(ctx)` in src/graphql/context.ts.
 *
 * Every v2 read goes through a `get*` function that calls this first, rather
 * than relying on the layout's redirect: layouts don't re-run on client
 * navigation and don't guard server actions.
 */
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

/**
 * householdId is read from the DB, not the session — accepting an invite moves
 * the user and deletes their old household, so a sign-in-time value goes stale.
 * Cached per request, so several loaders on one page cost one lookup.
 */
export const requireHousehold = cache(async (): Promise<{ userId: string; householdId: string }> => {
  const session = await auth()
  const user = session?.userId
    ? await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true, householdId: true } })
    : null
  if (!user) redirect('/login')
  return { userId: user.id, householdId: user.householdId }
})
