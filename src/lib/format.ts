const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

/** Exact, with cents: `$1,234.56`. What a transaction is worth. */
export function fmtMoney(amount: number): string {
  return money.format(amount)
}

/**
 * Whole-dollar and absolute: `$1,234`. The budget ledger's unit — cents are noise
 * next to a monthly plan, and a column of them stops aligning.
 *
 * Absolute on purpose: pair with `fmtSigned` wherever the sign carries meaning.
 */
export function fmtDollars(amount: number): string {
  return '$' + Math.round(Math.abs(amount)).toLocaleString('en-US')
}

/** `+$120` / `−$45`. Note the U+2212 minus — it aligns with digits, unlike a hyphen. */
export function fmtSigned(amount: number): string {
  return (amount < 0 ? '−' : '+') + '$' + Math.round(Math.abs(amount)).toLocaleString('en-US')
}

/** Clamp a ratio into the 0–1 a progress bar can draw. */
export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

/** Months are 1-based here, as everywhere in the budgeting domain. */
export function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Short date for a list row: "Aug 9". */
export function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}
