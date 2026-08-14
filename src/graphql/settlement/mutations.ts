import { builder } from '../builder'
import { requireAuth } from '../context'
import { prisma } from '@/lib/prisma'
import { UserFacingError } from '@/lib/errors'
import { parseDateOnly } from '@/lib/budget'

/** Ids arrive from the client — re-check against the caller's household before they reach a write. */
async function assertMember(householdId: string, userId: string): Promise<void> {
  const member = await prisma.user.count({ where: { id: userId, householdId } })
  if (member === 0) throw new UserFacingError('That person is not in your household')
}

builder.mutationFields((t) => ({
  /** Record a real payback. Pays down the running balance; not tied to any transaction. */
  createSettlement: t.prismaField({
    type: 'Settlement',
    args: {
      fromUserId: t.arg.string({ required: true }),
      toUserId: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
      date: t.arg.string({ required: true, description: 'YYYY-MM-DD.' }),
      note: t.arg.string(),
    },
    resolve: async (query, _root, { fromUserId, toUserId, amount, date, note }, ctx) => {
      const { householdId } = requireAuth(ctx)
      if (amount <= 0) throw new UserFacingError('Amount must be more than $0')
      if (fromUserId === toUserId) throw new UserFacingError('That is the same person')
      await assertMember(householdId, fromUserId)
      await assertMember(householdId, toUserId)

      return prisma.settlement.create({
        ...query,
        data: {
          householdId,
          fromUserId,
          toUserId,
          amount,
          date: parseDateOnly(date),
          note: note?.trim() || null,
        },
      })
    },
  }),

  deleteSettlement: t.boolean({
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_root, { id }, ctx) => {
      const { count } = await prisma.settlement.deleteMany({
        where: { id, householdId: requireAuth(ctx).householdId },
      })
      if (count === 0) throw new UserFacingError('Settlement not found')
      return true
    },
  }),
}))
