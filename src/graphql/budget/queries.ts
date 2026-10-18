import { builder } from '../builder'
import { requireAuth } from '../context'
import { BudgetLeafPayload, BudgetMonthPayload } from './type'
import { prisma } from '@/lib/prisma'
import { monthRange, budgetLeaves } from '@/lib/budget'
import { budgetMonth } from '@/server/budget'

builder.queryFields((t) => ({
  /** One person's whole budget for one month — see `budgetMonth` in src/server/budget.ts. */
  budgetMonth: t.field({
    type: BudgetMonthPayload,
    args: {
      year: t.arg.int({ required: true }),
      month: t.arg.int({ required: true, description: '1-based: 1 = January.' }),
      ownerId: t.arg.string({
        required: true,
        description: "Whose budget. Budgets are per-person; there is no household total.",
      }),
    },
    resolve: (_root, args, ctx) => budgetMonth(requireAuth(ctx).householdId, args),
  }),

  /**
   * Everything a transaction can be filed into, across both members.
   *
   * The path is built here rather than on the client because the client only
   * ever holds one person's tree at a time, and this list spans both.
   */
  budgetLeaves: t.field({
    type: [BudgetLeafPayload],
    resolve: async (_root, _args, ctx) => {
      const { householdId } = requireAuth(ctx)
      const nodes = await prisma.budgetNode.findMany({
        where: { householdId },
        select: { id: true, label: true, parentId: true, ownerId: true, isSavings: true },
        orderBy: { position: 'asc' },
      })
      return budgetLeaves(nodes)
    },
  }),

  /** One month of transactions, newest first. Bounded by the month, so unpaginated. */
  transactions: t.prismaField({
    type: ['Transaction'],
    args: {
      year: t.arg.int({ required: true }),
      month: t.arg.int({ required: true, description: '1-based: 1 = January.' }),
    },
    resolve: (query, _root, { year, month }, ctx) =>
      prisma.transaction.findMany({
        ...query,
        where: {
          householdId: requireAuth(ctx).householdId,
          date: monthRange({ year, month }),
        },
        // `id` last so the order is total: a Plaid sync stamps every row in the
        // batch with the same `createdAt` (Postgres evaluates now() once per
        // transaction), and without a unique tiebreak Postgres falls back to heap
        // order — which puts a row you just filed at the bottom of its date group,
        // since an UPDATE rewrites the tuple at the end of the heap.
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      }),
  }),
}))
