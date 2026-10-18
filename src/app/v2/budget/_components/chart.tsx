'use client'

import { useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import type { Options } from 'highcharts'
import { color } from '@/components/v2'
import { fmtDollars } from '@/lib/format'

/** Shared Highcharts chrome: transparent, inherits the page font, no credits or built-in legend. */
export const chartBase = {
  chart: { backgroundColor: 'transparent', style: { fontFamily: 'inherit' } },
  credits: { enabled: false },
  legend: { enabled: false },
} satisfies Options

/**
 * Mounts a Highcharts chart and rebuilds it when `key` changes. Highcharts is
 * imported inside the effect so it never runs during SSR.
 */
export function useHighchart(options: Options, key: string) {
  const el = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!el.current) return
    let chart: { destroy(): void } | undefined
    let cancelled = false
    import('highcharts').then(({ default: Highcharts }) => {
      if (!cancelled && el.current) chart = Highcharts.chart(el.current, options)
    })
    return () => {
      cancelled = true
      chart?.destroy()
    }
    // `key` stands in for `options`, which is a fresh object every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return el
}

const Row = styled.div({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  height: 26,
  fontSize: 13,
  color: color.text,
  fontVariantNumeric: 'tabular-nums',
})

const Swatch = styled.span({ width: 10, height: 10, borderRadius: 3, flex: 'none' })

/** Swatch · name · dollar amount, one row per series. */
export function Legend({ items }: { items: { name: string; color: string; value: number }[] }) {
  return items.map((item) => (
    <Row key={item.name}>
      <Swatch style={{ backgroundColor: item.color }} />
      <span style={{ flex: 1 }}>{item.name}</span>
      <span>{fmtDollars(item.value)}</span>
    </Row>
  ))
}
