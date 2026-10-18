import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { monthRange, type MonthSel } from '@/lib/budget'
import { fileableLeaves } from './budget'
import { requireHousehold } from './session'

/**
 * Newest first, with `id` last so the order is total: a Plaid sync stamps every
 * row in the batch with the same `createdAt` (Postgres evaluates now() once per
 * transaction), and without a unique tiebreak Postgres falls back to heap order —
 * which puts a row you just filed at the bottom of its date group, since an
 * UPDATE rewrites the tuple at the end of the heap.
 */
export const TRANSACTION_ORDER: Prisma.TransactionOrderByWithRelationInput[] = [
  { date: 'desc' },
  { createdAt: 'desc' },
  { id: 'desc' },
]

/** One month of the household's transactions, plus the leaves they file into. */
export async function getTransactionsMonth(sel: MonthSel) {
  const { householdId } = await requireHousehold()
  const [rows, leaves, linkedBanks] = await Promise.all([
    prisma.transaction.findMany({
      where: { householdId, date: monthRange(sel) },
      orderBy: TRANSACTION_ORDER,
      select: {
        id: true,
        merchant: true,
        date: true,
        amount: true,
        ownerId: true,
        shared: true,
        account: { select: { name: true, mask: true } },
        splits: { select: { budgetId: true } },
      },
    }),
    fileableLeaves(householdId),
    prisma.plaidItem.count({ where: { householdId, investmentsOnly: false } }),
  ])
  return {
    transactions: rows.map((row) => ({ ...row, date: row.date.toISOString(), amount: row.amount.toNumber() })),
    leaves,
    hasLinkedBank: linkedBanks > 0,
  }
}

export type TransactionsMonth = Awaited<ReturnType<typeof getTransactionsMonth>>
