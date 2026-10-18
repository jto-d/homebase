'use client'

import { brand } from '@/lib/theme'
import { color, Island, Text } from '@/components/v2'
import { currentMonth } from '@/components/MonthStepper'
import { roundCents, type MonthSel } from '@/lib/budget'
import { fmtDollars } from '@/lib/format'
import { chartBase, Legend, useHighchart } from './Chart'

const THIS_MONTH = brand.teal[600]
const LAST_MONTH = brand.zinc[300]
const AXIS_LABELS = { color: color.textMuted, fontSize: '11px' }

/** Running total as [day, total] points, so the lines show pace: where each month stood by day N. */
function cumulative(daily: readonly number[]): [number, number][] {
  let sum = 0
  return daily.map((d, i) => [i + 1, roundCents((sum += d))])
}

export function TrendChart({
  month,
  dailySpend,
  lastMonthDailySpend,
}: {
  month: MonthSel
  dailySpend: readonly number[]
  lastMonthDailySpend: readonly number[]
}) {
  const now = currentMonth()
  // The current month stops at today instead of running flat to the 31st.
  const today = now.year === month.year && now.month === month.month ? new Date().getDate() : dailySpend.length
  const thisMonth = cumulative(dailySpend).slice(0, today)
  const lastMonth = cumulative(lastMonthDailySpend)

  const el = useHighchart(
    {
      ...chartBase,
      chart: { ...chartBase.chart, type: 'line', height: 200, spacing: [8, 4, 0, 4] },
      title: { text: undefined },
      xAxis: {
        min: 1,
        max: Math.max(lastMonth.length, dailySpend.length),
        tickPositions: [1, 15, dailySpend.length],
        labels: { style: AXIS_LABELS },
        lineColor: color.border,
        tickLength: 0,
      },
      yAxis: {
        title: { text: undefined },
        min: 0,
        tickAmount: 3,
        gridLineColor: color.border,
        labels: {
          formatter() {
            return fmtDollars(Number(this.value))
          },
          style: AXIS_LABELS,
        },
      },
      tooltip: {
        shared: true,
        headerFormat: '<span style="font-size:11px">Day {point.key}</span><br/>',
        pointFormatter() {
          return `<span style="color:${this.color}">●</span> ${this.series.name}: <b>${fmtDollars(this.y ?? 0)}</b><br/>`
        },
      },
      plotOptions: {
        line: { marker: { enabled: false }, lineWidth: 2, states: { hover: { lineWidth: 2 } } },
      },
      series: [
        { type: 'line', name: 'Last month', data: lastMonth, color: LAST_MONTH, dashStyle: 'ShortDash' },
        { type: 'line', name: 'This month', data: thisMonth, color: THIS_MONTH },
      ],
    },
    JSON.stringify([thisMonth, lastMonth])
  )

  // Same day last month, so the comparison is like for like mid-month.
  const lastAtToday = lastMonth[Math.min(today, lastMonth.length) - 1]?.[1] ?? 0
  const thisAtToday = thisMonth.at(-1)?.[1] ?? 0

  return (
    <Island>
      <Text variant="strong">Trends</Text>
      <div ref={el} />
      <Legend
        items={[
          { name: 'This month', color: THIS_MONTH, value: thisAtToday },
          { name: 'Last month', color: LAST_MONTH, value: lastAtToday },
        ]}
      />
    </Island>
  )
}
