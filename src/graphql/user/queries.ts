import { builder } from '../builder'
import { requireAuth } from '../context'
import { prisma } from '@/lib/prisma'

builder.queryFields((t) => ({
  me: t.prismaField({
    type: 'User',
    resolve: (query, _root, _args, ctx) =>
      prisma.user.findUniqueOrThrow({
        ...query,
        where: { id: requireAuth(ctx).userId },
      }),
  }),
}))
