import { builder } from '../builder'
import { requireAuth } from '../context'
import { AcceptInvitePayload, HouseholdInvitePayload } from './type'
import { acceptInvite, createInvite } from '@/lib/household'

/** Base for shareable invite links; falls back to local dev. */
function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '')
}

builder.mutationFields((t) => ({
  createHouseholdInvite: t.field({
    type: HouseholdInvitePayload,
    resolve: async (_root, _args, ctx) => {
      const { userId, householdId } = requireAuth(ctx)
      const { code } = await createInvite({ householdId, createdByUserId: userId })
      return { code, url: `${appUrl()}/join/${code}` }
    },
  }),

  acceptHouseholdInvite: t.field({
    type: AcceptInvitePayload,
    args: { code: t.arg.string({ required: true }) },
    resolve: async (_root, { code }, ctx) => {
      const { userId } = requireAuth(ctx)
      const householdId = await acceptInvite({ code, userId })
      return { householdId }
    },
  }),
}))
