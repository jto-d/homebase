'use client'

import { brand } from '@/lib/theme'
import { color, Island, Text } from '@/components/v2'
import { budgetTotals, RENT, type BudgetTreeNode } from '@/lib/budget'
import { fmtDollars } from '@/lib/format'
import { chartBase, Legend, useHighchart } from './Chart'

/** Topmost nodes labelled rent, outside savings — a "Rent" group's "Rent" child isn't counted twice. */
function rentSum(nodes: readonly BudgetTreeNode[], of: (n: BudgetTreeNode) => number): number {
  return nodes.reduce((sum, n) => sum + (n.isSavings ? 0 : RENT.test(n.label) ? of(n) : rentSum(n.children, of)), 0)
}

// Homebase teal, dark to light. Ordinal ramp, validated: light end clears 2:1 on white.
const SHADES = [brand.teal[800], brand.teal[600], brand.teal[400], brand.teal[300]]

export function PlanChart({ roots }: { roots: BudgetTreeNode[] }) {
  const totals = budgetTotals(roots, [])
  const rent = rentSum(roots, (n) => n.budget)
  // spendingRemaining is everything outside savings; take rent back out of both sides.
  const spendingLeft = totals.spendingRemaining - (rent - rentSum(roots, (n) => n.spent))
  const spendingBudget = totals.budgeted - totals.savings - rent
  // Overspent months show the whole spend and no remaining slice, rather than a negative one.
  const remaining = Math.max(0, spendingLeft)
  const slices = [
    { name: 'Rent', y: rent },
    { name: 'Spending', y: spendingBudget - spendingLeft },
    { name: 'Saving', y: totals.savings },
    { name: 'Remaining', y: remaining },
  ].map((s, i) => ({ ...s, color: SHADES[i] }))

  const el = useHighchart(
    {
      ...chartBase,
      chart: { ...chartBase.chart, type: 'pie', height: 260 },
      title: {
        text: `<div style="text-align:center"><div style="font-size:20px;font-weight:600;color:${color.text}">${fmtDollars(remaining)}</div><div style="font-size:12px;color:${color.textMuted}">left to spend</div></div>`,
        useHTML: true,
        verticalAlign: 'middle',
        floating: true,
      },
      tooltip: {
        pointFormatter() {
          return `<b>${fmtDollars(this.y ?? 0)}</b> · ${Math.round(this.percentage ?? 0)}%`
        },
      },
      plotOptions: {
        pie: {
          innerSize: '72%',
          borderWidth: 2,
          borderRadius: 4,
          borderColor: color.surface,
          dataLabels: { enabled: false },
        },
      },
      series: [{ type: 'pie', name: 'Plan', data: slices }],
    },
    JSON.stringify(slices)
  )

  return (
    <Island>
      <Text variant="strong">Plan</Text>
      {totals.budgeted > 0 ? (
        <>
          <div ref={el} />
          <Legend items={slices.map((s) => ({ name: s.name, color: s.color, value: s.y }))} />
        </>
      ) : (
        <Text as="p" variant="muted">
          Budget something to see how it&apos;s split.
        </Text>
      )}
    </Island>
  )
}
