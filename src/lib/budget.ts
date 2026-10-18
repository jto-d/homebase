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

/** Months since year 0 — the one number that makes two selections comparable. */
export function monthOrdinal({ year, month }: MonthSel): number {
  return year * 12 + (month - 1)
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
export function sumMoney<T>(items: readonly T[], of: (item: T) => number): number {
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
  /// Inherited: true for a node flagged directly, or under one that is.
  isSavings: boolean
  /// Not inherited, unlike isSavings — set per node.
  rollsOver: boolean
  spent: number
  ytd: number
  /// Balance through the end of the *previous* month. 0 unless rollsOver.
  carried: number
  /// Open-ended target this fund saves toward. Meaningful alongside isSavings
  /// or rollsOver only — not rolled up by buildBudgetTree, since a goal is a
  /// leaf's own, never a group's.
  goalTarget: number | null
  /// Balance through the end of the selected month. 0 unless isSavings or
  /// rollsOver. Not rolled up, for the same reason as goalTarget.
  banked: number
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
 * - **ytd** — rolls up the same way as spent, so a savings group totals its
 *   children's contributions. Zero on anything outside a savings subtree.
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
    node.ytd = roundCents(node.ytd + sumMoney(node.children, (c) => c.ytd))
    // Same own-plus-children rule as spent, for the same reason.
    node.carried = roundCents(node.carried + sumMoney(node.children, (c) => c.carried))
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
  /** Budget of the topmost `isSavings` nodes — not double-counted with a savings parent. */
  savings: number
  /** What's left to spend outside savings — `(budgeted − savings) − (spent outside savings)`. */
  spendingRemaining: number
  /** What's left of income after everything budgeted. Negative = over-committed. */
  surplus: number
}

export function budgetTotals(
  roots: readonly BudgetTreeNode[],
  income: readonly { amount: number }[]
): BudgetTotals {
  const total = sumMoney(income, (i) => i.amount)
  const budgeted = sumMoney(roots, (r) => r.budget)
  const spent = sumMoney(roots, (r) => r.spent)
  // Stop recursing at the first isSavings node in a branch — a category flagged
  // under an already-flagged group would otherwise be summed twice. Same shape
  // for budget and spent so "outside savings" stays consistent between them.
  const savingsSum = (nodes: readonly BudgetTreeNode[], of: (n: BudgetTreeNode) => number): number =>
    sumMoney(nodes, (n) => (n.isSavings ? of(n) : savingsSum(n.children, of)))
  const savings = savingsSum(roots, (n) => n.budget)
  const savingsSpent = savingsSum(roots, (n) => n.spent)
  return {
    income: total,
    incomeCount: income.length,
    budgeted,
    spent,
    savings,
    spendingRemaining: roundCents(budgeted - savings - (spent - savingsSpent)),
    surplus: roundCents(total - budgeted),
  }
}

export interface BudgetPace {
  /** Budgeted minus spent — the hero number. Can go negative. */
  leftToSpend: number
  /** Remaining in the month, today included. 0 for a past month. */
  daysLeft: number
  /** `leftToSpend` spread over `daysLeft`. */
  perDay: number
  /** How much of the month has elapsed, 0–1. 1 for a past month, 0 for a future one. */
  monthFraction: number
  /** How far spend has run ahead of an even pace through today. Never negative. */
  overspent: number
}

/**
 * Spend-pace figures for the summary strip's hero card.
 *
 * Timezone note: every other date helper here (`monthRange`, `parseDateOnly`)
 * reads UTC, per the budgeting domain's convention. This one deliberately reads
 * `now` in **local** time instead, because "today" must agree with
 * `currentMonth()` in `src/components/MonthStepper.tsx` (also local) — a
 * pace figure computed against the wrong "today" would disagree with the month
 * the stepper considers current. Only the day-of-month uses local getters; the
 * days-in-month arithmetic stays UTC.
 */
export function budgetPace(totals: BudgetTotals, sel: MonthSel, now: Date = new Date()): BudgetPace {
  const leftToSpend = roundCents(totals.budgeted - totals.spent)
  const daysInMonth = new Date(Date.UTC(sel.year, sel.month, 0)).getUTCDate()
  const nowOrdinal = now.getFullYear() * 12 + now.getMonth()
  const selOrdinal = sel.year * 12 + (sel.month - 1)

  let elapsed: number
  let daysLeft: number
  if (selOrdinal < nowOrdinal) {
    elapsed = daysInMonth
    daysLeft = 0
  } else if (selOrdinal > nowOrdinal) {
    elapsed = 0
    daysLeft = daysInMonth
  } else {
    elapsed = now.getDate()
    daysLeft = daysInMonth - elapsed + 1 // today still counts as spendable
  }

  const monthFraction = elapsed / daysInMonth
  return {
    leftToSpend,
    daysLeft,
    perDay: leftToSpend / Math.max(1, daysLeft),
    monthFraction,
    overspent: Math.max(0, roundCents(totals.spent - totals.budgeted * monthFraction)),
  }
}

export interface BudgetLeaf {
  id: string
  label: string
  /** Ancestors included: `"Food › Groceries"`. Two people can both have a "Gas". */
  path: string
  ownerId: string
}

/**
 * Node ids inside a savings subtree — `isSavings` set on a group, inherited by
 * everything under it. The single implementation of that inheritance, read by
 * `budgetLeaves` (to exclude them from filing) and `buildBudgetTree`'s caller
 * (to decide which rows get a typed transfer instead of derived spend).
 */
export function savingsNodeIds(
  nodes: readonly { id: string; parentId: string | null; isSavings: boolean }[]
): Set<string> {
  return inheritedIds(nodes, (n) => n.isSavings)
}

// ponytail: rent is found by label, not a flag. Add an isRent flag on BudgetNode
// if people name it something else ("Mortgage", "Housing").
export const RENT = /\b(rent)\b/i

/** Node ids inside a rent subtree — a node labelled rent and everything under it. */
export function rentNodeIds(nodes: readonly { id: string; parentId: string | null; label: string }[]): Set<string> {
  return inheritedIds(nodes, (n) => RENT.test(n.label))
}

/** Ids of nodes that match `test` themselves or through an ancestor. */
function inheritedIds<T extends { id: string; parentId: string | null }>(
  nodes: readonly T[],
  test: (node: T) => boolean
): Set<string> {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const result = new Set<string>()
  for (const start of nodes) {
    // Two levels of ancestry at most, but bounded either way so a cycle from a
    // bad write can't spin here.
    for (let node = byId.get(start.id), hops = 0; node && hops < 8; hops++) {
      if (test(node)) {
        result.add(start.id)
        break
      }
      node = node.parentId != null ? byId.get(node.parentId) : undefined
    }
  }
  return result
}

/**
 * Every leaf across a household's budget trees, with its full path.
 *
 * The single implementation of `id -> "Group › Category"`, shared by the
 * `budgetLeaves` query (build once, list) and the transaction-filing
 * mutations (build once, look a path back up by owner). Savings nodes are
 * excluded — a transfer is typed directly onto the row, not filed like a charge.
 */
export function budgetLeaves(
  nodes: readonly { id: string; label: string; parentId: string | null; ownerId: string; isSavings: boolean }[]
): BudgetLeaf[] {
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const hasChildren = new Set(nodes.map((n) => n.parentId).filter((id) => id != null))
  const savings = savingsNodeIds(nodes)

  const path = (id: string): string => {
    const parts: string[] = []
    // Two levels of ancestry at most, but bounded by the map either way so a
    // cycle from a bad write can't spin here.
    for (let node = byId.get(id), hops = 0; node && hops < 8; hops++) {
      parts.unshift(node.label)
      node = node.parentId != null ? byId.get(node.parentId) : undefined
    }
    return parts.join(' › ')
  }

  return nodes
    .filter((node) => !hasChildren.has(node.id) && !savings.has(node.id))
    .map((node) => ({ id: node.id, label: node.label, path: path(node.id), ownerId: node.ownerId }))
    .sort((a, b) => a.path.localeCompare(b.path))
}

export interface LeftoverNode {
  id: string
  parentId: string | null
  /** This node's own budget for the month — dead on a group; see `buildBudgetTree`. */
  budget: number
  spent: number
  /** Inherited, like `BudgetNodeData.isSavings`. */
  isSavings: boolean
  rollsOver: boolean
}

/**
 * The pool a month-end sweep can draw from: leaf categories' own
 * budget-minus-spend, for leaves that don't already accrue.
 *
 * Leaves only — a group's `budget` is the sum of its children
 * (`buildBudgetTree`), so summing both would double the same money. Excludes
 * `isSavings`/`rollsOver` nodes for the reason `bankedBalances` (server) exists
 * at all: their leftover already sits in their own balance (`carried` or
 * `contributed`), so pooling it here would let the same dollar be swept twice.
 * `monthSwept` is netted out so the pool shrinks as it's used.
 */
export function monthLeftover(nodes: readonly LeftoverNode[], monthSwept: number): number {
  const hasChildren = new Set(nodes.map((n) => n.parentId).filter((id): id is string => id != null))
  const pool = sumMoney(
    nodes.filter((n) => !hasChildren.has(n.id) && !n.isSavings && !n.rollsOver),
    (n) => n.budget - n.spent
  )
  return Math.max(0, roundCents(pool - monthSwept))
}

export interface GoalProgress {
  /** `banked / goalTarget`, un-clamped — the caller clamps for a bar (`clamp01`). */
  ratio: number
  /** Months at the current rate until the target is hit. Null = no rate, or already there. */
  monthsLeft: number | null
  projectedDate: MonthSel | null
}

/**
 * Progress toward an open-ended goal, projected from the current balance and
 * monthly rate — there is no target date to read (see the plan's decision to
 * skip one). Dates are UTC, like every other date helper in this file.
 */
export function goalProgress({
  banked,
  goalTarget,
  monthly,
  sel,
}: {
  banked: number
  goalTarget: number
  monthly: number
  sel: MonthSel
}): GoalProgress {
  const ratio = goalTarget > 0 ? banked / goalTarget : 0
  if (banked >= goalTarget) return { ratio, monthsLeft: 0, projectedDate: null }
  if (monthly <= 0) return { ratio, monthsLeft: null, projectedDate: null }

  const monthsLeft = Math.ceil(roundCents(goalTarget - banked) / monthly)
  const targetOrd = monthOrdinal(sel) + monthsLeft
  return { ratio, monthsLeft, projectedDate: { year: Math.floor(targetOrd / 12), month: (targetOrd % 12) + 1 } }
}

/** Splits `total` across `nodeIds` as evenly as cents allow — the remainder lands on the first id. */
export function splitEvenly(total: number, nodeIds: readonly string[]): Map<string, number> {
  const result = new Map<string, number>()
  if (nodeIds.length === 0) return result

  const totalCents = toCents(total)
  const share = Math.floor(totalCents / nodeIds.length)
  let remainder = totalCents - share * nodeIds.length
  for (const id of nodeIds) {
    const cents = share + (remainder > 0 ? 1 : 0)
    if (remainder > 0) remainder--
    result.set(id, roundCents(cents / 100))
  }
  return result
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
 * Re-portion existing splits so they still sum to `newAmount`. One split takes
 * the whole new total; more than one keeps each share's ratio, with leftover
 * cents on the last row so the sum invariant holds.
 */
export function scaleSplits(
  oldAmount: number,
  newAmount: number,
  splits: readonly SplitInput[]
): SplitInput[] {
  if (splits.length === 0) return []
  if (splits.length === 1) return [{ budgetId: splits[0]!.budgetId, amount: roundCents(newAmount) }]

  const oldCents = toCents(oldAmount)
  const newCents = toCents(newAmount)
  let remaining = newCents
  return splits.map((s, i) => {
    if (i === splits.length - 1) return { budgetId: s.budgetId, amount: remaining / 100 }
    const share = oldCents === 0 ? 0 : Math.round(toCents(s.amount) * newCents / oldCents)
    remaining -= share
    return { budgetId: s.budgetId, amount: share / 100 }
  })
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

/**
 * The month a v2 page's `?y=&m=` asks for, or the current one when they're
 * missing or junk.
 *
 * ponytail: runs on the server, so the fallback is the server's clock — for a few
 * hours around midnight on the 1st it can disagree with the viewer's. Have the
 * client replace the URL with its own month if that ever bites.
 */
export function monthFromParams(y: unknown, m: unknown): MonthSel {
  const year = Number(y)
  const month = Number(m)
  if (Number.isInteger(year) && Number.isInteger(month) && year > 0 && month >= 1 && month <= 12) {
    return { year, month }
  }
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}
