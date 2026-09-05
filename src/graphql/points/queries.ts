import { builder } from '../builder'
import { requireAuth } from '../context'
import { prisma } from '@/lib/prisma'

builder.queryFields((t) => ({
  pointsPrograms: t.prismaField({
    type: ['PointsProgram'],
    resolve: (query, _root, _args, ctx) =>
      prisma.pointsProgram.findMany({
        ...query,
        where: { householdId: requireAuth(ctx).householdId },
        orderBy: [{ ownerId: 'asc' }, { createdAt: 'asc' }],
      }),
  }),
}))
