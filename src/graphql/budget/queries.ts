import { builder } from '../builder'
import { requireAuth } from '../context'
import { BudgetLeafPayload, BudgetMonthPayload } from './type'
import { prisma } from '@/lib/prisma'
import { monthRange, monthOrdinal, roundCents, budgetLeaves, savingsNodeIds } from '@/lib/budget'
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

/**
 * Balance through the end of the month before `sel`, per rollsOver node:
 * accrued budget minus spend since the later of the household's budget
 * start and the node's own creation. No extra queries when nothing rolls over.
 */
async function carriedBalances({
  householdId,
  ownerId,
  sel,
  nodes,
  household,
}: {
  householdId: string
  ownerId: string
  sel: { year: number; month: number }
  nodes: readonly { id: string; rollsOver: boolean; createdAt: Date }[]
  household: { budgetStartYear: number | null; budgetStartMonth: number | null } | null
}): Promise<Map<string, number>> {
  const rollsOverNodes = nodes.filter((n) => n.rollsOver)
  const result = new Map<string, number>()
  if (rollsOverNodes.length === 0) return result

  const householdStart =
    household?.budgetStartYear != null && household?.budgetStartMonth != null
      ? { year: household.budgetStartYear, month: household.budgetStartMonth }
      : null

  // A node created mid-year must not claim accrual from before it existed.
  const effectiveStart = (node: { createdAt: Date }) => {
    const created = { year: node.createdAt.getUTCFullYear(), month: node.createdAt.getUTCMonth() + 1 }
    return householdStart && monthOrdinal(householdStart) > monthOrdinal(created) ? householdStart : created
  }

  const selOrd = monthOrdinal(sel)
  const globalStart = rollsOverNodes
    .map(effectiveStart)
    .reduce((min, s) => (monthOrdinal(s) < monthOrdinal(min) ? s : min))

  const [priorSpend, priorOverrides] = await Promise.all([
    prisma.transactionSplit.groupBy({
      by: ['budgetId'],
      _sum: { amount: true },
      where: {
        budget: { householdId, ownerId, rollsOver: true },
        transaction: { date: { gte: monthRange(globalStart).gte, lt: monthRange(sel).gte } },
      },
    }),
    prisma.budgetNodeMonth.findMany({
      where: { node: { householdId, ownerId, rollsOver: true }, budget: { not: null } },
      select: { nodeId: true, year: true, month: true, budget: true },
    }),
  ])

  const priorSpendBy = new Map(priorSpend.map((row) => [row.budgetId, row._sum.amount?.toNumber() ?? 0]))
  const overridesByNode = new Map<string, Map<number, number>>()
  for (const row of priorOverrides) {
    const byMonth = overridesByNode.get(row.nodeId) ?? new Map<number, number>()
    byMonth.set(monthOrdinal({ year: row.year, month: row.month }), row.budget!.toNumber())
    overridesByNode.set(row.nodeId, byMonth)
  }

  for (const node of rollsOverNodes) {
    const startOrd = monthOrdinal(effectiveStart(node))
    if (startOrd >= selOrd) {
      result.set(node.id, 0)
      continue
    }
    const overrides = overridesByNode.get(node.id)
    let budgeted = 0
    for (let ord = startOrd; ord < selOrd; ord++) {
      budgeted += overrides?.get(ord) ?? 0
    }
    result.set(node.id, roundCents(budgeted - (priorSpendBy.get(node.id) ?? 0)))
  }

  return result
}

/**
 * Balance through the end of the selected month for every accruing node
 * (`isSavings` or `rollsOver`) — what the Goals card totals as banked.
 *
 * `swept` is a second, independent term on top of whatever `carriedBalances`
 * already gives a rollover node: a deliberate one-time deposit, never
 * re-derived from budget-minus-spend, so it can't drift against the replay.
 * See the rollover-invariant note on `sweepUnspent` in mutations.ts.
 *
 * Savings: lifetime contributed + lifetime swept, through `sel` — not
 * year-scoped like `ytd`, since a goal's progress shouldn't reset every
 * January. Rollover: `carried` (through the end of the *prior* month) plus
 * this month's own budget-minus-spend plus lifetime swept.
 */
async function bankedBalances({
  householdId,
  ownerId,
  sel,
  nodes,
  savings,
  carriedByNode,
  thisMonthByNode,
}: {
  householdId: string
  ownerId: string
  sel: { year: number; month: number }
  nodes: readonly { id: string; rollsOver: boolean }[]
  savings: Set<string>
  carriedByNode: Map<string, number>
  thisMonthByNode: Map<string, { budget: number; spent: number }>
}): Promise<{ banked: Map<string, number>; monthSwept: number }> {
  const accruing = nodes.filter((n) => n.rollsOver || savings.has(n.id))
  const banked = new Map<string, number>()
  if (accruing.length === 0) return { banked, monthSwept: 0 }

  const selOrd = monthOrdinal(sel)
  const rows = await prisma.budgetNodeMonth.findMany({
    where: {
      node: { householdId, ownerId },
      OR: [{ contributed: { not: null } }, { swept: { not: null } }],
    },
    select: { nodeId: true, year: true, month: true, contributed: true, swept: true },
  })

  const contributedByNode = new Map<string, number>()
  const sweptByNode = new Map<string, number>()
  let monthSwept = 0
  for (const row of rows) {
    const ord = monthOrdinal({ year: row.year, month: row.month })
    if (ord > selOrd) continue
    if (row.contributed != null) {
      contributedByNode.set(row.nodeId, (contributedByNode.get(row.nodeId) ?? 0) + row.contributed.toNumber())
    }
    if (row.swept != null) {
      const amount = row.swept.toNumber()
      sweptByNode.set(row.nodeId, (sweptByNode.get(row.nodeId) ?? 0) + amount)
      if (ord === selOrd) monthSwept = roundCents(monthSwept + amount)
    }
  }

  for (const node of accruing) {
    const swept = sweptByNode.get(node.id) ?? 0
    if (savings.has(node.id)) {
      banked.set(node.id, roundCents((contributedByNode.get(node.id) ?? 0) + swept))
    } else {
      const thisMonth = thisMonthByNode.get(node.id) ?? { budget: 0, spent: 0 }
      banked.set(node.id, roundCents((carriedByNode.get(node.id) ?? 0) + thisMonth.budget - thisMonth.spent + swept))
    }
  }

  return { banked, monthSwept }
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
      const carriedByNode = await carriedBalances({ householdId, ownerId, sel: { year, month }, nodes, household })

      const thisMonthByNode = new Map(
        nodes
          .filter((n) => n.rollsOver)
          .map((n) => [
            n.id,
            { budget: n.months[0]?.budget?.toNumber() ?? 0, spent: spentBy.get(n.id)?.toNumber() ?? 0 },
          ])
      )
      const { banked: bankedByNode, monthSwept } = await bankedBalances({
        householdId,
        ownerId,
        sel: { year, month },
        nodes,
        savings,
        carriedByNode,
        thisMonthByNode,
      })

      return {
        nodes: nodes.map((node) => {
          const isSavingsNode = savings.has(node.id)
          return {
            id: node.id,
            parentId: node.parentId,
            label: node.label,
            icon: node.icon,
            position: node.position,
            budget: node.months[0]?.budget?.toNumber() ?? 0,
            annualLimit: node.annualLimit?.toNumber() ?? null,
            isSavings: isSavingsNode,
            rollsOver: node.rollsOver,
            // Savings: the typed transfer for this month. Everything else: splits.
            spent: isSavingsNode
              ? (node.months[0]?.contributed?.toNumber() ?? 0)
              : (spentBy.get(node.id)?.toNumber() ?? 0),
            ytd: isSavingsNode ? (contributedYtdBy.get(node.id)?.toNumber() ?? 0) : 0,
            carried: carriedByNode.get(node.id) ?? 0,
            goalTarget: node.goalTarget?.toNumber() ?? null,
            banked: bankedByNode.get(node.id) ?? 0,
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
        monthSwept,
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
