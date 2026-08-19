/**
 * Perk cycle math and credit aggregation — ported from Anchor's src/utils/perk.ts.
 * This is the whole reason the Cards feature works: every "left to redeem",
 * reset date, and status chip in the UI routes through here rather than
 * re-deriving cycle boundaries inline.
 *
 * Deliberately client-side, not a resolver: it runs against the same
 * `CreditCards` query payload from the tracker, the summary, and the card
 * detail page, so there's one implementation instead of one per screen.
 *
 * Two timezone subtleties carried over verbatim — don't "fix" either:
 * - Cycle windows are built in **local** time (`new Date(y, m-1, d)`).
 * - A stored `YYYY-MM-DD` credit/opened date is parsed as `date + 'T00:00:00'`
 *   to force local midnight, so the day doesn't slip.
 * (`src/lib/format.ts`'s `monthLabel`/`fmtDay` read UTC instead — a different,
 * also-deliberate choice for the budget domain. Don't mix the two here.)
 */
import { clamp01 } from './format'
import { sumMoney } from './budget'

export const PERIOD_META = {
  MONTHLY: { label: 'Monthly', per: 12 },
  QUARTERLY: { label: 'Quarterly', per: 4 },
  SEMI_ANNUAL: { label: 'Semi-annual', per: 2 },
  ANNUAL: { label: 'Annual', per: 1 },
  QUADRENNIAL: { label: 'Quadrennial', per: 0.25 },
} as const

export interface PerkCreditLike {
  amount: number
  /** `YYYY-MM-DD`. */
  date: string
}

export interface PerkLike {
  totalAmount: number
  period: string
  resetType: string
  perkCredits: readonly PerkCreditLike[]
}

export type StatusKey = 'captured' | 'partial' | 'expiring' | 'open' | 'ongoing'

export type CycleWindow = { start: Date; end: Date }

export function annualValue(perk: PerkLike): number {
  const meta = PERIOD_META[perk.period as keyof typeof PERIOD_META]
  return perk.totalAmount * (meta?.per ?? 1)
}

// ── Cycle window helpers ──────────────────────────────────────────────────────

function dateOnly(year: number, month: number /* 1-12 */, day: number): Date {
  return new Date(year, month - 1, day)
}

function calendarCycleWindow(period: string, now: Date): CycleWindow {
  const y = now.getFullYear()
  const m = now.getMonth() + 1 // 1-12

  switch (period) {
    case 'MONTHLY': {
      const start = dateOnly(y, m, 1)
      const end = m === 12 ? dateOnly(y + 1, 1, 1) : dateOnly(y, m + 1, 1)
      return { start, end }
    }
    case 'QUARTERLY': {
      const qStart = m <= 3 ? 1 : m <= 6 ? 4 : m <= 9 ? 7 : 10
      const end = qStart + 3 > 12 ? dateOnly(y + 1, 1, 1) : dateOnly(y, qStart + 3, 1)
      return { start: dateOnly(y, qStart, 1), end }
    }
    case 'SEMI_ANNUAL': {
      const start = m < 7 ? dateOnly(y, 1, 1) : dateOnly(y, 7, 1)
      const end = m < 7 ? dateOnly(y, 7, 1) : dateOnly(y + 1, 1, 1)
      return { start, end }
    }
    case 'QUADRENNIAL': {
      // 4-year cycles anchored at 2024
      const EPOCH = 2024
      const cycleYear = EPOCH + Math.floor((y - EPOCH) / 4) * 4
      return { start: dateOnly(cycleYear, 1, 1), end: dateOnly(cycleYear + 4, 1, 1) }
    }
    default: // ANNUAL
      return { start: dateOnly(y, 1, 1), end: dateOnly(y + 1, 1, 1) }
  }
}

function anniversaryCycleWindow(period: string, openedDateStr: string, now: Date): CycleWindow {
  const opened = new Date(openedDateStr.slice(0, 10) + 'T00:00:00')
  const annMonth = opened.getMonth() + 1 // 1-12
  const annDay = opened.getDate()
  const openedYear = opened.getFullYear()
  const y = now.getFullYear()
  const m = now.getMonth() + 1

  if (period === 'MONTHLY') return calendarCycleWindow('MONTHLY', now)

  if (period === 'ANNUAL') {
    const thisAnn = dateOnly(y, annMonth, annDay)
    if (now >= thisAnn) return { start: thisAnn, end: dateOnly(y + 1, annMonth, annDay) }
    return { start: dateOnly(y - 1, annMonth, annDay), end: thisAnn }
  }

  if (period === 'QUARTERLY') {
    // 3-month cycles anchored at anniversary month
    const mOffset = (m - annMonth + 12) % 12
    const qNum = Math.floor(mOffset / 3)
    const cycleStartMonth = ((annMonth - 1 + qNum * 3) % 12) + 1
    const cycleStartYear = cycleStartMonth > m ? y - 1 : y
    const start = dateOnly(cycleStartYear, cycleStartMonth, 1)
    const nextM = cycleStartMonth + 3
    const end = nextM > 12 ? dateOnly(cycleStartYear + 1, nextM - 12, 1) : dateOnly(cycleStartYear, nextM, 1)
    return { start, end }
  }

  if (period === 'SEMI_ANNUAL') {
    // 6-month cycles anchored at anniversary month
    const mOffset = (m - annMonth + 12) % 12
    const halfNum = Math.floor(mOffset / 6)
    const cycleStartMonth = ((annMonth - 1 + halfNum * 6) % 12) + 1
    const cycleStartYear = cycleStartMonth > m ? y - 1 : y
    const start = dateOnly(cycleStartYear, cycleStartMonth, 1)
    const nextM = cycleStartMonth + 6
    const end = nextM > 12 ? dateOnly(cycleStartYear + 1, nextM - 12, 1) : dateOnly(cycleStartYear, nextM, 1)
    return { start, end }
  }

  if (period === 'QUADRENNIAL') {
    // 4-year cycles from the card open date
    const yearsOpen = y - openedYear
    const cycleNum = Math.floor(yearsOpen / 4)
    const cycleStart = dateOnly(openedYear + cycleNum * 4, annMonth, annDay)
    if (now >= cycleStart) return { start: cycleStart, end: dateOnly(openedYear + (cycleNum + 1) * 4, annMonth, annDay) }
    const prev = dateOnly(openedYear + (cycleNum - 1) * 4, annMonth, annDay)
    return { start: prev, end: cycleStart }
  }

  return calendarCycleWindow(period, now)
}

export function cycleWindow(perk: { period: string; resetType: string }, cardOpenedDate?: string | null, now = new Date()): CycleWindow {
  if (perk.resetType === 'ANNIVERSARY' && cardOpenedDate) {
    return anniversaryCycleWindow(perk.period, cardOpenedDate, now)
  }
  return calendarCycleWindow(perk.period, now)
}

export function nextResetDate(perk: { period: string; resetType: string }, cardOpenedDate?: string | null, now = new Date()): Date {
  return cycleWindow(perk, cardOpenedDate, now).end
}

// Final stretch of a cycle: last 5 days for MONTHLY, last calendar month for everything else.
function isInResetWindow(perk: { period: string; resetType: string }, cardOpenedDate?: string | null, now = new Date()): boolean {
  const { end } = cycleWindow(perk, cardOpenedDate, now)
  const windowStart = new Date(end)
  if (perk.period === 'MONTHLY') {
    windowStart.setDate(windowStart.getDate() - 5)
  } else {
    windowStart.setMonth(windowStart.getMonth() - 1)
  }
  return now >= windowStart
}

// ── Credit aggregation ────────────────────────────────────────────────────────

export function capturedInCycle(perk: PerkLike, cardOpenedDate?: string | null, now = new Date()): number {
  const { start, end } = cycleWindow(perk, cardOpenedDate, now)
  return sumMoney(
    perk.perkCredits.filter((c) => {
      const d = new Date(c.date + 'T00:00:00')
      return d >= start && d < end
    }),
    (c) => c.amount
  )
}

// Sum of credits in the current calendar year — used for the monthly perk annual-rollup bar.
export function capturedYTD(perk: PerkLike, now = new Date()): number {
  const y = now.getFullYear()
  return sumMoney(
    perk.perkCredits.filter((c) => new Date(c.date + 'T00:00:00').getFullYear() === y),
    (c) => c.amount
  )
}

export function capturedThisMonth(perk: PerkLike, now = new Date()): number {
  const y = now.getFullYear()
  const m = now.getMonth()
  return sumMoney(
    perk.perkCredits.filter((c) => {
      const d = new Date(c.date + 'T00:00:00')
      return d.getFullYear() === y && d.getMonth() === m
    }),
    (c) => c.amount
  )
}

// ── Coverage (the single "how much of this perk is done" source) ──────────────

export type CoverageBasis = 'cycle' | 'year'

export interface PerkCoverage {
  cap: number // the budget being measured against
  captured: number // dollars logged toward it
  remaining: number // unused budget (0 for open-ended perks)
  pct: number // 0..1 fraction of cap captured (0 for open-ended)
  covered: boolean // cap fully captured
  openEnded: boolean // perk has no cap (totalAmount === 0)
}

/**
 * Canonical perk coverage. `basis: 'cycle'` measures the current reset window
 * against the per-period budget; `basis: 'year'` measures the calendar-year
 * total against the annualized value. Every "captured / remaining / covered"
 * question routes through this — no inline `totalAmount === 0` / `pct >= 1`.
 */
export function perkCoverage(perk: PerkLike, opts: { basis: CoverageBasis; cardOpenedDate?: string | null; now?: Date }): PerkCoverage {
  const { basis, cardOpenedDate, now = new Date() } = opts
  const openEnded = perk.totalAmount === 0
  const cap = basis === 'cycle' ? perk.totalAmount : annualValue(perk)
  const captured = basis === 'cycle' ? capturedInCycle(perk, cardOpenedDate, now) : capturedYTD(perk, now)
  const remaining = openEnded ? 0 : Math.max(0, cap - captured)
  const pct = openEnded ? 0 : clamp01(captured / cap)
  return { cap, captured, remaining, pct, covered: !openEnded && pct >= 1, openEnded }
}

// ── Derived status ────────────────────────────────────────────────────────────

export function perkPct(perk: PerkLike, cardOpenedDate?: string | null, now = new Date()): number {
  return perkCoverage(perk, { basis: 'cycle', cardOpenedDate, now }).pct
}

export function perkStatus(perk: PerkLike, cardOpenedDate?: string | null, now = new Date()): { key: StatusKey; label: string } {
  const cov = perkCoverage(perk, { basis: 'cycle', cardOpenedDate, now })
  if (cov.openEnded) return { key: 'ongoing', label: 'Ongoing' }
  if (cov.covered) return { key: 'captured', label: 'Captured' }
  if (isInResetWindow(perk, cardOpenedDate, now)) return { key: 'expiring', label: 'Resets soon' }
  if (cov.pct === 0) return { key: 'open', label: 'Available' }
  return { key: 'partial', label: 'In progress' }
}

export function periodLabel(period: string): string {
  return PERIOD_META[period as keyof typeof PERIOD_META]?.label ?? period
}
