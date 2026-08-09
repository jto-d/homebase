const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function fmtMoney(amount: number): string {
  return money.format(amount)
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
