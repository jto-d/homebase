import { builder } from '../builder'
import { requireAuth } from '../context'
import { prisma } from '@/lib/prisma'
import { UserFacingError } from '@/lib/errors'
import { parseDateOnly, replaceSplits, validateSplits, type SplitInput } from '@/lib/budget'

const TransactionSplitInput = builder.inputType('TransactionSplitInput', {
  fields: (t) => ({
    budgetId: t.string({ required: true }),
    amount: t.float({ required: true }),
  }),
})

/**
 * Ids arrive from the client, so every one is re-checked against the caller's
 * household before it reaches a `where` clause. Without this a guessed id would
 * let someone file spend into another household's budget.
 */
async function assertMember(householdId: string, userId: string): Promise<void> {
  const member = await prisma.user.count({ where: { id: userId, householdId } })
  if (member === 0) throw new UserFacingError('That person is not in your household')
}

/**
 * Splits may only target leaves. A parent's spend is the sum of its children, so
 * filing against one would count the money twice.
 */
async function assertBudgets(householdId: string, budgetIds: readonly string[]): Promise<void> {
  if (budgetIds.length === 0) return
  const found = await prisma.budgetNode.count({
    where: { id: { in: [...budgetIds] }, householdId, children: { none: {} } },
  })
  if (found !== new Set(budgetIds).size) {
    throw new UserFacingError('Budget not found, or it has line items to file into instead')
  }
}

/** A node and its descendants — the rows a delete would actually take with it. */
async function subtreeIds(householdId: string, id: string): Promise<string[]> {
  const children = await prisma.budgetNode.findMany({
    where: { householdId, parentId: id },
    select: { id: true },
  })
  const grandchildren = await prisma.budgetNode.findMany({
    where: { householdId, parentId: { in: children.map((c) => c.id) } },
    select: { id: true },
  })
  return [id, ...children.map((c) => c.id), ...grandchildren.map((g) => g.id)]
}

builder.mutationFields((t) => ({
  /**
   * Add a group (no parent), a category (parent is a group) or a line item
   * (parent is a category). Depth stops at two: past that the ledger stops
   * being a ledger and starts being a filesystem.
   */
  addBudgetNode: t.boolean({
    args: {
      ownerId: t.arg.string({ required: true }),
      parentId: t.arg.string({ description: 'Omit for a top-level group.' }),
      label: t.arg.string({ required: true }),
      icon: t.arg.string({ required: true }),
    },
    resolve: async (_root, { ownerId, parentId, label, icon }, ctx) => {
      const { householdId } = requireAuth(ctx)
      const name = label.trim()
      if (!name) throw new UserFacingError('Give it a name')
      await assertMember(householdId, ownerId)

      if (parentId != null) {
        // Depth is measured through the grandparent: a parent that already has
        // one is a line item, and a child of it would be the third level.
        const parent = await prisma.budgetNode.findFirst({
          where: { id: parentId, householdId, ownerId },
          select: { parent: { select: { parentId: true } } },
        })
        if (!parent) throw new UserFacingError('Budget not found')
        if (parent.parent?.parentId != null) {
          throw new UserFacingError("Line items can't have their own line items")
        }
      }

      // Append: the new row lands at the bottom of its list, where the person
      // adding it is already looking.
      const siblings = await prisma.budgetNode.count({
        where: { householdId, ownerId, parentId: parentId ?? null },
      })

      await prisma.budgetNode.create({
        data: { householdId, ownerId, parentId: parentId ?? null, label: name, icon, position: siblings },
      })
      return true
    },
  }),

  renameBudgetNode: t.boolean({
    args: { id: t.arg.string({ required: true }), label: t.arg.string({ required: true }) },
    resolve: async (_root, { id, label }, ctx) => {
      const { householdId } = requireAuth(ctx)
      const name = label.trim()
      if (!name) throw new UserFacingError('Give it a name')

      const { count } = await prisma.budgetNode.updateMany({
        where: { id, householdId },
        data: { label: name },
      })
      if (count === 0) throw new UserFacingError('Budget not found')
      return true
    },
  }),

  /**
   * Deletes the node and everything under it.
   *
   * The split check covers the whole subtree, not just this node: children
   * cascade, so a filed grandchild would otherwise fail at the database as a
   * foreign-key violation and reach the client as "Unexpected error."
   */
  deleteBudgetNode: t.boolean({
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_root, { id }, ctx) => {
      const { householdId } = requireAuth(ctx)
      const exists = await prisma.budgetNode.count({ where: { id, householdId } })
      if (exists === 0) throw new UserFacingError('Budget not found')

      const ids = await subtreeIds(householdId, id)
      const filed = await prisma.transactionSplit.count({ where: { budgetId: { in: ids } } })
      if (filed > 0) {
        throw new UserFacingError(
          `${filed} transaction${filed === 1 ? '' : 's'} still filed under this — refile them first`
        )
      }

      await prisma.budgetNode.deleteMany({ where: { id, householdId } })
      return true
    },
  }),

  /**
   * Set a node's budget for one month.
   *
   * Writes both the month override and the rolling default in one transaction:
   * the number you type is what this month is, *and* what next month starts as,
   * while the months already behind you keep whatever they were set to.
   */
  setNodeBudget: t.boolean({
    args: {
      id: t.arg.string({ required: true }),
      year: t.arg.int({ required: true }),
      month: t.arg.int({ required: true, description: '1-based: 1 = January.' }),
      budget: t.arg.float({ required: true }),
    },
    resolve: async (_root, { id, year, month, budget }, ctx) => {
      const { householdId } = requireAuth(ctx)
      if (budget < 0) throw new UserFacingError('A budget cannot be negative')
      if (month < 1 || month > 12) throw new UserFacingError('That month does not exist')

      const node = await prisma.budgetNode.findFirst({
        where: { id, householdId },
        select: { _count: { select: { children: true } } },
      })
      if (!node) throw new UserFacingError('Budget not found')
      if (node._count.children > 0) {
        throw new UserFacingError('This is calculated from its line items')
      }

      await prisma.$transaction([
        prisma.budgetNode.updateMany({ where: { id, householdId }, data: { budget } }),
        prisma.budgetNodeMonth.upsert({
          where: { nodeId_year_month: { nodeId: id, year, month } },
          create: { nodeId: id, year, month, budget },
          update: { budget },
        }),
      ])
      return true
    },
  }),

  /** Pass null to clear the limit, which makes it an ordinary node again. */
  setNodeAnnualLimit: t.boolean({
    args: { id: t.arg.string({ required: true }), annualLimit: t.arg.float() },
    resolve: async (_root, { id, annualLimit }, ctx) => {
      const { householdId } = requireAuth(ctx)
      if (annualLimit != null && annualLimit < 0) throw new UserFacingError('A limit cannot be negative')

      const { count } = await prisma.budgetNode.updateMany({
        where: { id, householdId },
        // A zero limit would render a bar that is always full; treat it as "none".
        data: { annualLimit: annualLimit ? annualLimit : null },
      })
      if (count === 0) throw new UserFacingError('Budget not found')
      return true
    },
  }),

  addIncomeSource: t.boolean({
    args: {
      ownerId: t.arg.string({ required: true }),
      label: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
    },
    resolve: async (_root, { ownerId, label, amount }, ctx) => {
      const { householdId } = requireAuth(ctx)
      const name = label.trim()
      if (!name) throw new UserFacingError('Give the income source a name')
      if (amount < 0) throw new UserFacingError('Income cannot be negative')
      await assertMember(householdId, ownerId)

      const siblings = await prisma.incomeSource.count({ where: { householdId, ownerId } })
      await prisma.incomeSource.create({
        data: { householdId, ownerId, label: name, amount, position: siblings },
      })
      return true
    },
  }),

  renameIncomeSource: t.boolean({
    args: { id: t.arg.string({ required: true }), label: t.arg.string({ required: true }) },
    resolve: async (_root, { id, label }, ctx) => {
      const { householdId } = requireAuth(ctx)
      const name = label.trim()
      if (!name) throw new UserFacingError('Give the income source a name')

      const { count } = await prisma.incomeSource.updateMany({
        where: { id, householdId },
        data: { label: name },
      })
      if (count === 0) throw new UserFacingError('Income source not found')
      return true
    },
  }),

  setIncomeAmount: t.boolean({
    args: { id: t.arg.string({ required: true }), amount: t.arg.float({ required: true }) },
    resolve: async (_root, { id, amount }, ctx) => {
      const { householdId } = requireAuth(ctx)
      if (amount < 0) throw new UserFacingError('Income cannot be negative')

      const { count } = await prisma.incomeSource.updateMany({
        where: { id, householdId },
        data: { amount },
      })
      if (count === 0) throw new UserFacingError('Income source not found')
      return true
    },
  }),

  removeIncomeSource: t.boolean({
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_root, { id }, ctx) => {
      const { count } = await prisma.incomeSource.deleteMany({
        where: { id, householdId: requireAuth(ctx).householdId },
      })
      if (count === 0) throw new UserFacingError('Income source not found')
      return true
    },
  }),

  /** Marks the month the budget begins. Household-wide — see the schema comment. */
  setBudgetStart: t.boolean({
    args: {
      year: t.arg.int({ required: true }),
      month: t.arg.int({ required: true, description: '1-based: 1 = January.' }),
    },
    resolve: async (_root, { year, month }, ctx) => {
      const { householdId } = requireAuth(ctx)
      if (month < 1 || month > 12) throw new UserFacingError('That month does not exist')

      await prisma.household.update({
        where: { id: householdId },
        data: { budgetStartYear: year, budgetStartMonth: month },
      })
      return true
    },
  }),

  createTransaction: t.prismaField({
    type: 'Transaction',
    args: {
      merchant: t.arg.string({ required: true }),
      date: t.arg.string({ required: true, description: 'YYYY-MM-DD.' }),
      amount: t.arg.float({ required: true }),
      ownerId: t.arg.string({ description: 'Who paid. Omit for a joint account.' }),
      note: t.arg.string(),
      budgetId: t.arg.string({
        description: 'Shortcut for the common case: files the whole amount to one budget.',
      }),
    },
    resolve: async (query, _root, { merchant, date, amount, ownerId, note, budgetId }, ctx) => {
      const { householdId } = requireAuth(ctx)
      const name = merchant.trim()
      if (!name) throw new UserFacingError('Give the transaction a merchant')
      if (amount <= 0) throw new UserFacingError('Amount must be more than $0')
      if (ownerId) await assertMember(householdId, ownerId)
      if (budgetId) await assertBudgets(householdId, [budgetId])

      return prisma.transaction.create({
        ...query,
        data: {
          householdId,
          merchant: name,
          date: parseDateOnly(date),
          amount,
          ownerId: ownerId ?? null,
          note: note?.trim() || null,
          // One split for the full amount keeps the invariant true from birth;
          // no budget means unfiled, which is a valid state.
          splits: budgetId ? { create: [{ budgetId, amount }] } : undefined,
        },
      })
    },
  }),

  /**
   * Changing the amount unfiles the transaction: the existing splits summed to
   * the old total, and there is no honest way to guess how the difference should
   * be shared out. The UI warns before calling this.
   */
  updateTransaction: t.prismaField({
    type: 'Transaction',
    args: {
      id: t.arg.string({ required: true }),
      merchant: t.arg.string(),
      date: t.arg.string({ description: 'YYYY-MM-DD.' }),
      amount: t.arg.float(),
      note: t.arg.string(),
      ownerId: t.arg.string({ description: 'Who paid. Pass null to mark it joint.' }),
    },
    resolve: async (query, _root, args, ctx) => {
      const { householdId } = requireAuth(ctx)
      const existing = await prisma.transaction.findFirst({
        where: { id: args.id, householdId },
        select: { id: true, amount: true },
      })
      if (!existing) throw new UserFacingError('Transaction not found')

      const merchant = args.merchant?.trim()
      if (args.merchant != null && !merchant) throw new UserFacingError('Give the transaction a merchant')
      if (args.amount != null && args.amount <= 0) throw new UserFacingError('Amount must be more than $0')
      if (args.ownerId) await assertMember(householdId, args.ownerId)

      const amountChanged = args.amount != null && !existing.amount.equals(args.amount)

      await prisma.$transaction(async (tx) => {
        if (amountChanged) await replaceSplits(tx, existing.id, [])
        await tx.transaction.update({
          where: { id: existing.id },
          data: {
            ...(merchant ? { merchant } : {}),
            ...(args.date != null ? { date: parseDateOnly(args.date) } : {}),
            ...(args.amount != null ? { amount: args.amount } : {}),
            ...(args.note !== undefined ? { note: args.note?.trim() || null } : {}),
            ...(args.ownerId !== undefined ? { ownerId: args.ownerId ?? null } : {}),
          },
        })
      })

      return prisma.transaction.findUniqueOrThrow({ ...query, where: { id: existing.id } })
    },
  }),

  /**
   * The only way to file a transaction. Replace-all, so filing to a single budget
   * is just a one-element list and there is exactly one code path feeding spend.
   * An empty list unfiles.
   */
  setTransactionSplits: t.prismaField({
    type: 'Transaction',
    args: {
      transactionId: t.arg.string({ required: true }),
      splits: t.arg({ type: [TransactionSplitInput], required: true }),
    },
    resolve: async (query, _root, { transactionId, splits }, ctx) => {
      const { householdId } = requireAuth(ctx)
      const txn = await prisma.transaction.findFirst({
        where: { id: transactionId, householdId },
        select: { id: true, amount: true },
      })
      if (!txn) throw new UserFacingError('Transaction not found')

      const input: SplitInput[] = splits.map((s) => ({ budgetId: s.budgetId, amount: s.amount }))
      await assertBudgets(householdId, input.map((s) => s.budgetId))

      const decision = validateSplits(txn.amount.toNumber(), input)
      if (!decision.ok) throw new UserFacingError(decision.error)

      await prisma.$transaction((tx) => replaceSplits(tx, txn.id, input))

      return prisma.transaction.findUniqueOrThrow({ ...query, where: { id: txn.id } })
    },
  }),

  deleteTransaction: t.boolean({
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_root, { id }, ctx) => {
      // Splits cascade with the transaction, so no budget is left half-filed.
      const { count } = await prisma.transaction.deleteMany({
        where: { id, householdId: requireAuth(ctx).householdId },
      })
      if (count === 0) throw new UserFacingError('Transaction not found')
      return true
    },
  }),
}))
