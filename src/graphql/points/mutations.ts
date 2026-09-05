import { builder } from '../builder'
import { requireAuth } from '../context'
import { prisma } from '@/lib/prisma'
import { UserFacingError } from '@/lib/errors'
import { parseDateOnly } from '@/lib/budget'
import { PointsProgramKind } from './type'

/** Ids arrive from the client — re-check against the caller's household before they reach a write. */
async function assertMember(householdId: string, userId: string): Promise<void> {
  const member = await prisma.user.count({ where: { id: userId, householdId } })
  if (member === 0) throw new UserFacingError('That person is not in your household')
}

builder.mutationFields((t) => ({
  addPointsProgram: t.prismaField({
    type: 'PointsProgram',
    args: {
      name: t.arg.string({ required: true }),
      kind: t.arg({ type: PointsProgramKind, required: true }),
      ownerId: t.arg.string({ required: true }),
      balance: t.arg.int({ required: true }),
    },
    resolve: async (query, _root, { name, kind, ownerId, balance }, ctx) => {
      const { householdId } = requireAuth(ctx)
      const trimmed = name.trim()
      if (!trimmed) throw new UserFacingError('Name is required')
      if (balance < 0) throw new UserFacingError('Balance cannot be negative')
      await assertMember(householdId, ownerId)

      return prisma.pointsProgram.create({
        ...query,
        data: { householdId, ownerId, name: trimmed, kind, balance },
      })
    },
  }),

  /** The tap-to-edit commit on the Points page — overwrites the balance directly. */
  updatePointsProgramBalance: t.prismaField({
    type: 'PointsProgram',
    args: {
      programId: t.arg.string({ required: true }),
      balance: t.arg.int({ required: true }),
    },
    resolve: async (query, _root, { programId, balance }, ctx) => {
      const { householdId } = requireAuth(ctx)
      if (balance < 0) throw new UserFacingError('Balance cannot be negative')

      const { count } = await prisma.pointsProgram.updateMany({
        where: { id: programId, householdId },
        data: { balance },
      })
      if (count === 0) throw new UserFacingError('Program not found')

      return prisma.pointsProgram.findUniqueOrThrow({ ...query, where: { id: programId } })
    },
  }),

  /** Cascades its redemption history — the confirm dialog says so. */
  removePointsProgram: t.boolean({
    args: { programId: t.arg.string({ required: true }) },
    resolve: async (_root, { programId }, ctx) => {
      const { count } = await prisma.pointsProgram.deleteMany({
        where: { id: programId, householdId: requireAuth(ctx).householdId },
      })
      if (count === 0) throw new UserFacingError('Program not found')
      return true
    },
  }),

  logPointsRedemption: t.prismaField({
    type: 'PointsRedemption',
    args: {
      programId: t.arg.string({ required: true }),
      points: t.arg.int({ required: true }),
      date: t.arg.string({ required: true, description: 'YYYY-MM-DD.' }),
      description: t.arg.string({ required: true }),
      ownerId: t.arg.string(),
    },
    resolve: async (query, _root, { programId, points, date, description, ownerId }, ctx) => {
      const { householdId } = requireAuth(ctx)
      if (points <= 0) throw new UserFacingError('Points must be more than 0')
      const trimmed = description.trim()
      if (!trimmed) throw new UserFacingError('Description is required')
      const parsedDate = parseDateOnly(date)
      if (ownerId) await assertMember(householdId, ownerId)

      const program = await prisma.pointsProgram.findFirst({
        where: { id: programId, householdId },
        select: { id: true },
      })
      if (!program) throw new UserFacingError('Program not found')

      const [redemption] = await prisma.$transaction([
        prisma.pointsRedemption.create({
          ...query,
          data: { programId, points, date: parsedDate, description: trimmed, ownerId: ownerId || null },
        }),
        prisma.pointsProgram.update({
          where: { id: programId },
          data: { balance: { decrement: points } },
        }),
      ])
      return redemption
    },
  }),

  /** Undo for a mis-logged redemption — puts the points back on the program. */
  deletePointsRedemption: t.boolean({
    args: { redemptionId: t.arg.string({ required: true }) },
    resolve: async (_root, { redemptionId }, ctx) => {
      const { householdId } = requireAuth(ctx)
      const redemption = await prisma.pointsRedemption.findFirst({
        where: { id: redemptionId, program: { householdId } },
        select: { id: true, programId: true, points: true },
      })
      if (!redemption) throw new UserFacingError('Redemption not found')

      await prisma.$transaction([
        prisma.pointsRedemption.delete({ where: { id: redemption.id } }),
        prisma.pointsProgram.update({
          where: { id: redemption.programId },
          data: { balance: { increment: redemption.points } },
        }),
      ])
      return true
    },
  }),
}))
