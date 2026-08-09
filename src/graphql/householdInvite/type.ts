import { builder } from '../builder'
import { prisma } from '@/lib/prisma'

// HouseholdInvite itself is not exposed: nothing on the client browses invites,
// and `status` is the only bit that matters, so timestamps stay out of the schema.

export const InvitePreview = builder.simpleObject('InvitePreview', {
  fields: (t) => ({
    inviterName: t.string(),
    householdFull: t.boolean(),
  }),
})

export const HouseholdInvitePayload = builder.simpleObject('HouseholdInvitePayload', {
  fields: (t) => ({
    code: t.string(),
    url: t.string(),
  }),
})

// Not a simpleObject: `household` needs a real resolver so the Prisma plugin can
// build the nested selection for `members`.
export const AcceptInvitePayload = builder.objectRef<{ householdId: string }>('AcceptInvitePayload')

builder.objectType(AcceptInvitePayload, {
  fields: (t) => ({
    household: t.prismaField({
      type: 'Household',
      resolve: (query, parent) =>
        prisma.household.findUniqueOrThrow({ ...query, where: { id: parent.householdId } }),
    }),
  }),
})
