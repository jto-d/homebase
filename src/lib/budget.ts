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

/**
 * The half-open UTC range from January 1 to the end of `month`, for a
 * year-to-date figure. Same UTC reasoning as `monthRange` — and sharper here,
 * since a local `new Date(year, 0, 1)` lands on December 31 west of UTC and
 * quietly pulls last year's December into the total.
 */
export function yearToMonthRange({ year, month }: MonthSel): { gte: Date; lt: Date } {
  return {
    gte: new Date(Date.UTC(year, 0, 1)),
    lt: new Date(Date.UTC(year, month, 1)),
  }
}

/** Integer cents, so split sums compare exactly instead of within a float epsilon. */
export function toCents(amount: number): number {
  return Math.round(amount * 100)
}

/** Round a dollar amount to whole cents — the single rounding policy for the app. */
export function roundCents(amount: number): number {
  return Math.round(amount * 100) / 100
}

/** Sum money via integer cents, so a column of rows can't accumulate float drift. */
function sumMoney<T>(items: readonly T[], of: (item: T) => number): number {
  return items.reduce((cents, item) => cents + toCents(of(item)), 0) / 100
}

/** One node of the budget tree, as the API hands it over: flat, with a parent id. */
export interface BudgetNodeData {
  id: string
  parentId: string | null
  label: string
  icon: string
  position: number
  budget: number
  annualLimit: number | null
  spent: number
  ytd: number
}

export interface BudgetTreeNode extends BudgetNodeData {
  children: BudgetTreeNode[]
}

/**
 * Turn the flat node list into the tree the ledger renders, rolling up money as
 * it goes. This is the *only* implementation of the roll-up rule — the ledger,
 * the group headers and the summary totals all read what it computes.
 *
 * The rule, and its one asymmetry:
 *
 * - **budget** — a node with children is the sum of its children; a leaf holds
 *   its own. That is what makes a category with line items read-only in the UI:
 *   its number is no longer its own to set.
 * - **spent** — own splits *plus* children, never replaced. A node filed against
 *   before it grew children keeps that history instead of dropping it on the
 *   floor the moment someone adds a line item under it.
 */
export function buildBudgetTree(nodes: readonly BudgetNodeData[]): BudgetTreeNode[] {
  const byId = new Map<string, BudgetTreeNode>(nodes.map((n) => [n.id, { ...n, children: [] }]))
  const roots: BudgetTreeNode[] = []

  for (const node of byId.values()) {
    // A parentId pointing outside the list (another owner's node, say) is treated
    // as a root rather than dropped — better a stray row than a silent hole.
    const parent = node.parentId != null ? byId.get(node.parentId) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }

  const rollUp = (node: BudgetTreeNode): BudgetTreeNode => {
    node.children.sort((a, b) => a.position - b.position)
    node.children.forEach(rollUp)
    if (node.children.length > 0) node.budget = sumMoney(node.children, (c) => c.budget)
    node.spent = roundCents(node.spent + sumMoney(node.children, (c) => c.spent))
    return node
  }

  roots.sort((a, b) => a.position - b.position)
  roots.forEach(rollUp)
  return roots
}

export interface BudgetTotals {
  income: number
  incomeCount: number
  budgeted: number
  spent: number
  /** What's left of income after everything budgeted. Negative = over-committed. */
  surplus: number
}

export function budgetTotals(
  roots: readonly BudgetTreeNode[],
  income: readonly { amount: number }[]
): BudgetTotals {
  const total = sumMoney(income, (i) => i.amount)
  const budgeted = sumMoney(roots, (r) => r.budget)
  return {
    income: total,
    incomeCount: income.length,
    budgeted,
    spent: sumMoney(roots, (r) => r.spent),
    surplus: roundCents(total - budgeted),
  }
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
