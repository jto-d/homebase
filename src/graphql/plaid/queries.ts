import { builder } from '../builder'
import { requireAuth } from '../context'
import { prisma } from '@/lib/prisma'

builder.queryFields((t) => ({
  plaidItems: t.prismaField({
    type: ['PlaidItem'],
    resolve: (query, _root, _args, ctx) =>
      prisma.plaidItem.findMany({
        ...query,
        where: { householdId: requireAuth(ctx).householdId },
        orderBy: { createdAt: 'asc' },
      }),
  }),
}))
