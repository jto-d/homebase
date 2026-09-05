import { builder } from '../builder'
import { requireAuth } from '../context'
import { prisma } from '@/lib/prisma'
import { UserFacingError } from '@/lib/errors'

builder.mutationFields((t) => ({
  renameAccount: t.boolean({
    args: { id: t.arg.string({ required: true }), name: t.arg.string({ required: true }) },
    resolve: async (_root, { id, name }, ctx) => {
      const { householdId } = requireAuth(ctx)
      const nickname = name.trim()
      if (!nickname) throw new UserFacingError('Give it a name')

      const { count } = await prisma.plaidAccount.updateMany({
        where: { id, item: { householdId } },
        data: { nickname },
      })
      if (count === 0) throw new UserFacingError('Account not found')
      return true
    },
  }),
}))
