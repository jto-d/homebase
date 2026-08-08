import { builder } from '../builder'
import { requireAuth } from '../context'
import { prisma } from '@/lib/prisma'

builder.queryFields((t) => ({
  household: t.prismaField({
    type: 'Household',
    resolve: (query, _root, _args, ctx) =>
      prisma.household.findUniqueOrThrow({
        ...query,
        where: { id: requireAuth(ctx).householdId },
      }),
  }),
}))
