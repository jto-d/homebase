import { builder } from '../builder'
import { InvitePreview } from './type'
import { prisma } from '@/lib/prisma'
import { HOUSEHOLD_MAX_MEMBERS } from '@/lib/household'
import { UserFacingError } from '@/lib/errors'
import { memberLabel } from '@/lib/members'

builder.queryField('householdInvitePreview', (t) =>
  t.field({
    type: InvitePreview,
    args: { code: t.arg.string({ required: true }) },
    // The one public resolver in the schema: it renders the invite landing
    // page, which the partner sees before they have signed in. It deliberately
    // does not call requireAuth — and it exposes only the inviter's display
    // name, never their email or anything about the household's contents.
    resolve: async (_root, { code }) => {
      const invite = await prisma.householdInvite.findUnique({
        where: { code },
        select: {
          createdBy: { select: { name: true, email: true } },
          household: { select: { _count: { select: { members: true } } } },
        },
      })
      if (!invite) throw new UserFacingError('Invite not found')

      return {
        inviterName: memberLabel(invite.createdBy),
        householdFull: invite.household._count.members >= HOUSEHOLD_MAX_MEMBERS,
      }
    },
  })
)
