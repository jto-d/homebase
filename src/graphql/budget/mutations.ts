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

async function assertBudgets(householdId: string, budgetIds: readonly string[]): Promise<void> {
  if (budgetIds.length === 0) return
  const found = await prisma.budget.count({ where: { id: { in: [...budgetIds] }, householdId } })
  if (found !== new Set(budgetIds).size) throw new UserFacingError('Budget not found')
}

builder.mutationFields((t) => ({
  createBudget: t.prismaField({
    type: 'Budget',
    args: {
      name: t.arg.string({ required: true }),
      amount: t.arg.float({ required: true }),
      ownerId: t.arg.string({ required: true, description: 'Budgets always belong to one member.' }),
    },
    resolve: async (query, _root, { name, amount, ownerId }, ctx) => {
      const { householdId } = requireAuth(ctx)
      const label = name.trim()
      if (!label) throw new UserFacingError('Give the budget a name')
      if (amount < 0) throw new UserFacingError('A budget cannot be negative')
      await assertMember(householdId, ownerId)

      // Same person, same name is the unique constraint. Check first so the user
      // gets this sentence instead of a masked Prisma constraint violation.
      const clash = await prisma.budget.count({ where: { ownerId, name: label } })
      if (clash > 0) throw new UserFacingError(`There is already a "${label}" budget for that person`)

      return prisma.budget.create({
        ...query,
        data: { householdId, ownerId, name: label, amount },
      })
    },
  }),

  updateBudget: t.prismaField({
    type: 'Budget',
    args: {
      id: t.arg.string({ required: true }),
      name: t.arg.string(),
      amount: t.arg.float(),
    },
    resolve: async (query, _root, { id, name, amount }, ctx) => {
      const { householdId } = requireAuth(ctx)
      if (amount != null && amount < 0) throw new UserFacingError('A budget cannot be negative')
      const label = name?.trim()
      if (name != null && !label) throw new UserFacingError('Give the budget a name')

      // updateMany, not update: it takes the householdId scope in the same
      // statement, so an id from another household matches nothing.
      const { count } = await prisma.budget.updateMany({
        where: { id, householdId },
        data: { ...(label ? { name: label } : {}), ...(amount != null ? { amount } : {}) },
      })
      if (count === 0) throw new UserFacingError('Budget not found')

      return prisma.budget.findUniqueOrThrow({ ...query, where: { id } })
    },
  }),

  /** Refuses while transactions still point at it — see the Restrict FK on TransactionSplit. */
  deleteBudget: t.boolean({
    args: { id: t.arg.string({ required: true }) },
    resolve: async (_root, { id }, ctx) => {
      const { householdId } = requireAuth(ctx)

      const filed = await prisma.transactionSplit.count({ where: { budgetId: id, budget: { householdId } } })
      if (filed > 0) {
        throw new UserFacingError(
          `${filed} transaction${filed === 1 ? '' : 's'} still filed here — refile them first`
        )
      }

      const { count } = await prisma.budget.deleteMany({ where: { id, householdId } })
      if (count === 0) throw new UserFacingError('Budget not found')
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
