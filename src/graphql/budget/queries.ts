import { builder } from '../builder'
import { requireAuth } from '../context'
import { BudgetLeafPayload, BudgetMonthPayload } from './type'
import { prisma } from '@/lib/prisma'
import { monthRange, budgetLeaves, savingsNodeIds } from '@/lib/budget'
import { DEFAULT_GROUPS, DEFAULT_INCOME } from '@/lib/budgetDefaults'
import { UserFacingError } from '@/lib/errors'

/**
 * Give a person the default tree the first time their budget is opened.
 *
 * Seeded per owner, not per household: the two budgets are separate, so a
 * partner's tree materialises when someone first looks at it.
 *
 * ponytail: seeding on the read path can double-seed if two first loads race.
 * Move it into upsertUserForSignIn/acceptInvite if that ever bites — the cost is
 * dragging budget defaults into the auth path for a case that needs two tabs
 * opened in the same second.
 */
async function seedIfEmpty(householdId: string, ownerId: string): Promise<void> {
  const existing = await prisma.budgetNode.count({ where: { householdId, ownerId } })
  if (existing > 0) return

  await prisma.$transaction([
    ...DEFAULT_GROUPS.map((group, position) =>
      prisma.budgetNode.create({
        data: {
          householdId,
          ownerId,
          label: group.label,
          icon: group.icon,
          position,
          isSavings: group.isSavings ?? false,
          children: {
            create: group.categories.map((category, childPosition) => ({
              householdId,
              ownerId,
              label: category.label,
              icon: category.icon,
              position: childPosition,
              annualLimit: category.annualLimit ?? null,
            })),
          },
        },
      })
    ),
    ...DEFAULT_INCOME.map((income, position) =>
      prisma.incomeSource.create({
        data: { householdId, ownerId, label: income.label, sub: income.sub, position },
      })
    ),
  ])
}

builder.queryFields((t) => ({
  /**
   * One person's whole budget for one month.
   *
   * Five queries, none of them per-row: the nodes (with just this month's
   * overrides joined in), the income sources, the household's budget start, a
   * grouped sum over splits for the month, and a grouped sum over savings
   * contributions for the year to date.
   *
   * The list comes back flat, with `parentId` on each node; `buildBudgetTree`
   * on the client shapes it and applies the roll-up rule. Nesting it into the
   * schema would freeze the two-deep cap into three payload types and give the
   * roll-up a second implementation to drift from.
   */
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
    resolve: async (_root, { year, month, ownerId }, ctx) => {
      const { householdId } = requireAuth(ctx)
      const member = await prisma.user.count({ where: { id: ownerId, householdId } })
      if (member === 0) throw new UserFacingError('That person is not in your household')

      await seedIfEmpty(householdId, ownerId)

      const [nodes, income, household, monthSpend, ytdContributed] = await Promise.all([
        prisma.budgetNode.findMany({
          where: { householdId, ownerId },
          orderBy: { position: 'asc' },
          include: { months: { where: { year, month } } },
        }),
        prisma.incomeSource.findMany({
          where: { householdId, ownerId },
          orderBy: { position: 'asc' },
        }),
        prisma.household.findUnique({
          where: { id: householdId },
          select: { budgetStartYear: true, budgetStartMonth: true },
        }),
        prisma.transactionSplit.groupBy({
          by: ['budgetId'],
          _sum: { amount: true },
          where: {
            budget: { householdId, ownerId },
            transaction: { date: monthRange({ year, month }) },
          },
        }),
        // Cumulative through the selected month — that's the year-to-date figure.
        prisma.budgetNodeMonth.groupBy({
          by: ['nodeId'],
          _sum: { contributed: true },
          where: { node: { householdId, ownerId }, year, month: { lte: month } },
        }),
      ])

      const spentBy = new Map(monthSpend.map((row) => [row.budgetId, row._sum.amount]))
      const contributedYtdBy = new Map(ytdContributed.map((row) => [row.nodeId, row._sum.contributed]))
      const savings = savingsNodeIds(nodes)

      return {
        nodes: nodes.map((node) => {
          const isSavingsNode = savings.has(node.id)
          return {
            id: node.id,
            parentId: node.parentId,
            label: node.label,
            icon: node.icon,
            position: node.position,
            // The month override wins; absent, the rolling default applies.
            budget: (node.months[0]?.budget ?? node.budget).toNumber(),
            annualLimit: node.annualLimit?.toNumber() ?? null,
            isSavings: isSavingsNode,
            // Savings: the typed transfer for this month. Everything else: splits.
            spent: isSavingsNode
              ? (node.months[0]?.contributed?.toNumber() ?? 0)
              : (spentBy.get(node.id)?.toNumber() ?? 0),
            ytd: isSavingsNode ? (contributedYtdBy.get(node.id)?.toNumber() ?? 0) : 0,
          }
        }),
        income: income.map((source) => ({
          id: source.id,
          label: source.label,
          sub: source.sub,
          amount: source.amount.toNumber(),
          position: source.position,
        })),
        budgetStartYear: household?.budgetStartYear ?? null,
        budgetStartMonth: household?.budgetStartMonth ?? null,
      }
    },
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
