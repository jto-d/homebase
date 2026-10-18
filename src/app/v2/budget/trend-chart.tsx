'use client'

import { useEffect, useRef } from 'react'
import type { Options } from 'highcharts'
import { brand } from '@/lib/theme'
import { color, currentMonth, Text, type MonthSel } from '@/components/v2'
import { roundCents } from '@/lib/budget'
import { fmtDollars } from '@/lib/format'
import { Island, LegendRow, Swatch } from './plan-chart'

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
  const el = useRef<HTMLDivElement>(null)
  const now = currentMonth()
  // The current month stops at today instead of running flat to the 31st.
  const today = now.year === month.year && now.month === month.month ? new Date().getDate() : dailySpend.length
  const thisMonth = cumulative(dailySpend).slice(0, today)
  const lastMonth = cumulative(lastMonthDailySpend)
  const key = JSON.stringify([thisMonth, lastMonth])

  useEffect(() => {
    if (!el.current) return
    const options: Options = {
      chart: {
        type: 'line',
        height: 200,
        backgroundColor: 'transparent',
        style: { fontFamily: 'inherit' },
        spacing: [8, 4, 0, 4],
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },
      xAxis: {
        min: 1,
        max: Math.max(lastMonth.length, dailySpend.length),
        tickPositions: [1, 15, dailySpend.length],
        labels: {
          style: { color: color.textMuted, fontSize: '11px' },
        },
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
          style: { color: color.textMuted, fontSize: '11px' },
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
        { type: 'line', name: 'Last month', data: lastMonth, color: brand.zinc[300], dashStyle: 'ShortDash' },
        { type: 'line', name: 'This month', data: thisMonth, color: brand.teal[600] },
      ],
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

  // Same day last month, so the comparison is like for like mid-month.
  const lastAtToday = lastMonth[Math.min(today, lastMonth.length) - 1]?.[1] ?? 0
  const thisAtToday = thisMonth.at(-1)?.[1] ?? 0

  return (
    <Island>
      <Text variant="strong">Trends</Text>
      <div ref={el} />
      {[
        { name: 'This month', value: thisAtToday, swatch: brand.teal[600] },
        { name: 'Last month', value: lastAtToday, swatch: brand.zinc[300] },
      ].map((row) => (
        <LegendRow key={row.name}>
          <Swatch style={{ backgroundColor: row.swatch }} />
          <span style={{ flex: 1 }}>{row.name}</span>
          <span>{fmtDollars(row.value)}</span>
        </LegendRow>
      ))}
    </Island>
  )
}
