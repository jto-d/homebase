import { builder } from '../builder'
import { requireAuth } from '../context'
import { prisma } from '@/lib/prisma'

builder.queryFields((t) => ({
  creditCards: t.prismaField({
    type: ['CreditCard'],
    resolve: (query, _root, _args, ctx) =>
      prisma.creditCard.findMany({
        ...query,
        where: { householdId: requireAuth(ctx).householdId },
        orderBy: [{ ownerId: 'asc' }, { createdAt: 'asc' }],
      }),
  }),
}))
