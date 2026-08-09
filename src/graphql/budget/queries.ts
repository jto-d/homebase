import { builder } from '../builder'
import { requireAuth } from '../context'
import { BudgetSpend } from './type'
import { prisma } from '@/lib/prisma'
import { monthRange } from '@/lib/budget'

builder.queryFields((t) => ({
  /**
   * Every budget in the household, with the month's spend derived from splits.
   *
   * Two queries, zipped in memory: the budget list, and one grouped sum over the
   * splits whose transaction falls in the month. Nothing is denormalised, so the
   * total cannot disagree with the transactions it came from.
   */
  budgetMonth: t.field({
    type: [BudgetSpend],
    args: {
      year: t.arg.int({ required: true }),
      month: t.arg.int({ required: true, description: '1-based: 1 = January.' }),
    },
    resolve: async (_root, { year, month }, ctx) => {
      const { householdId } = requireAuth(ctx)

      const [budgets, spendByBudget] = await Promise.all([
        prisma.budget.findMany({
          where: { householdId },
          orderBy: [{ ownerId: 'asc' }, { name: 'asc' }],
        }),
        prisma.transactionSplit.groupBy({
          by: ['budgetId'],
          _sum: { amount: true },
          where: {
            budget: { householdId },
            transaction: { date: monthRange({ year, month }) },
          },
        }),
      ])

      const spent = new Map(spendByBudget.map((row) => [row.budgetId, row._sum.amount]))

      return budgets.map((budget) => ({
        id: budget.id,
        name: budget.name,
        ownerId: budget.ownerId,
        amount: budget.amount.toNumber(),
        spent: spent.get(budget.id)?.toNumber() ?? 0,
      }))
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
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
      }),
  }),
}))
