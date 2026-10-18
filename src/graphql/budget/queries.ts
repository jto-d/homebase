import { builder } from '../builder'
import { requireAuth } from '../context'
import { BudgetLeafPayload, BudgetMonthPayload } from './type'
import { prisma } from '@/lib/prisma'
import { monthRange } from '@/lib/budget'
import { budgetMonth, fileableLeaves } from '@/server/budget'
import { TRANSACTION_ORDER } from '@/server/transactions'

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
    resolve: (_root, _args, ctx) => fileableLeaves(requireAuth(ctx).householdId),
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
        orderBy: TRANSACTION_ORDER,
      }),
  }),
}))
