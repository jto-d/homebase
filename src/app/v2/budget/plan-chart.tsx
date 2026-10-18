'use client'

import { useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import type { Options } from 'highcharts'
import { brand } from '@/lib/theme'
import { color, radius, Text } from '@/components/v2'
import { budgetTotals, RENT, type BudgetTreeNode } from '@/lib/budget'
import { fmtDollars } from '@/lib/format'

export const Island = styled.section({
  border: `1px solid ${color.border}`,
  borderRadius: radius.md * 2,
  backgroundColor: color.surface,
  padding: 16,
})

export const LegendRow = styled.div({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: 26,
  fontSize: 13,
  color: color.text,
  fontVariantNumeric: 'tabular-nums',
})

export const Swatch = styled.span({ width: 10, height: 10, borderRadius: 3, flex: 'none' })

/** Topmost nodes labelled rent, outside savings — a "Rent" group's "Rent" child isn't counted twice. */
function rentSum(nodes: readonly BudgetTreeNode[], of: (n: BudgetTreeNode) => number): number {
  return nodes.reduce((sum, n) => sum + (n.isSavings ? 0 : RENT.test(n.label) ? of(n) : rentSum(n.children, of)), 0)
}

// Homebase teal, dark to light. Ordinal ramp, validated: light end clears 2:1 on white.
const SHADES = [brand.teal[800], brand.teal[600], brand.teal[400], brand.teal[300]]

export function PlanChart({ roots }: { roots: BudgetTreeNode[] }) {
  const el = useRef<HTMLDivElement>(null)
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
  const key = JSON.stringify(slices)

  useEffect(() => {
    if (!el.current || totals.budgeted <= 0) return
    const options: Options = {
      chart: {
        type: 'pie',
        height: 260,
        backgroundColor: 'transparent',
        style: { fontFamily: 'inherit' },
      },
      title: {
        text: `<div style="text-align:center"><div style="font-size:20px;font-weight:600;color:${color.text}">${fmtDollars(remaining)}</div><div style="font-size:12px;color:${color.textMuted}">left to spend</div></div>`,
        useHTML: true,
        verticalAlign: 'middle',
        floating: true,
      },
      credits: { enabled: false },
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
      legend: { enabled: false },
      series: [{ type: 'pie', name: 'Plan', data: slices }],
    }
    // Loaded in the effect so Highcharts never runs during SSR.
    let chart: { destroy(): void } | undefined
    let cancelled = false
    import('highcharts').then(({ default: Highcharts }) => {
      if (!cancelled && el.current) chart = Highcharts.chart(el.current, options)
    })
    return () => {
      cancelled = true
      chart?.destroy()
    }
  }, [key])

  return (
    <Island>
      <Text variant="strong">Plan</Text>
      {totals.budgeted > 0 ? (
        <>
          <div ref={el} />
          {slices.map((s) => (
            <LegendRow key={s.name}>
              <Swatch style={{ backgroundColor: s.color }} />
              <span style={{ flex: 1 }}>{s.name}</span>
              <span>{fmtDollars(s.y)}</span>
            </LegendRow>
          ))}
        </>
      ) : (
        <Text as="p" variant="muted">
          Budget something to see how it&apos;s split.
        </Text>
      )}
    </Island>
  )
}
