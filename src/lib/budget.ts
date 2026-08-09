/**
 * Budgeting logic that isn't a database call.
 *
 * The headline rule of this domain: a budget never stores what was spent. Spend
 * is always derived by summing `TransactionSplit` rows for the month, so there is
 * exactly one writer and no pair of totals that can drift apart.
 */
import type { Prisma } from '@prisma/client'
import { UserFacingError } from './errors'

/** Months are 1-based (1 = January) everywhere in this app — args, helpers, UI. */
export interface MonthSel {
  year: number
  month: number
}

/**
 * The half-open UTC range covering a month, shaped for a Prisma `date` filter.
 *
 * UTC on purpose: `Transaction.date` is a `@db.Date`, so building the bounds from
 * local getters would put the first and last day of the month in the wrong one.
 */
export function monthRange({ year, month }: MonthSel): { gte: Date; lt: Date } {
  return {
    gte: new Date(Date.UTC(year, month - 1, 1)),
    lt: new Date(Date.UTC(year, month, 1)),
  }
}

/**
 * Parse the `YYYY-MM-DD` a date input sends into the UTC midnight Postgres
 * stores for a `@db.Date`. `new Date('2026-08-09')` already parses as UTC, but
 * this rejects everything else rather than quietly yielding an Invalid Date.
 */
export function parseDateOnly(input: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    throw new UserFacingError('Date must look like 2026-08-09')
  }
  const date = new Date(`${input}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) throw new UserFacingError('That date does not exist')
  return date
}

/** Integer cents, so split sums compare exactly instead of within a float epsilon. */
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

export interface SplitInput {
  budgetId: string
  amount: number
}

export type SplitsDecision = { ok: true } | { ok: false; error: string }

/**
 * Whether a set of splits may replace a transaction's current ones.
 *
 * An empty list is valid and means "unfiled" — the transaction exists but counts
 * against nobody's budget. Anything else must account for the whole amount, or
 * the derived spend would silently under-report.
 */
export function validateSplits(amount: number, splits: readonly SplitInput[]): SplitsDecision {
  if (splits.length === 0) return { ok: true }

  if (splits.some((s) => s.amount <= 0)) {
    return { ok: false, error: 'Every split must be more than $0' }
  }

  const budgetIds = new Set(splits.map((s) => s.budgetId))
  if (budgetIds.size !== splits.length) {
    return { ok: false, error: 'Each budget can only appear once in a split' }
  }

  const total = splits.reduce((sum, s) => sum + toCents(s.amount), 0)
  const target = toCents(amount)
  if (total !== target) {
    const diff = (target - total) / 100
    return {
      ok: false,
      error:
        diff > 0
          ? `Splits are $${diff.toFixed(2)} short of the transaction total`
          : `Splits are $${Math.abs(diff).toFixed(2)} over the transaction total`,
    }
  }

  return { ok: true }
}

/**
 * Replace a transaction's splits wholesale. Replace-all is the only write mode —
 * there is no add/edit/remove of an individual split, which is what keeps the
 * sum invariant checkable in one place.
 *
 * Must run inside the caller's `$transaction`: between the delete and the create
 * the transaction has no splits at all.
 */
export async function replaceSplits(
  tx: Prisma.TransactionClient,
  transactionId: string,
  splits: readonly SplitInput[]
): Promise<void> {
  await tx.transactionSplit.deleteMany({ where: { transactionId } })
  if (splits.length === 0) return
  await tx.transactionSplit.createMany({
    data: splits.map((s) => ({ transactionId, budgetId: s.budgetId, amount: s.amount })),
  })
}
