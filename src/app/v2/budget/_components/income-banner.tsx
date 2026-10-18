'use client'

import styled from '@emotion/styled'
import { WarningCircleIcon } from '@phosphor-icons/react'
import { color, Island, Text } from '@/components/v2'
import { fmtDollars } from '@/lib/format'

// Same shell as the chart islands; only the icon carries the tone.
const Banner = styled(Island)({ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px' })

const Copy = styled.div({ display: 'flex', flexDirection: 'column', gap: 2 })

/** Budget should equal income (zero-based). No income entered = nothing to compare against. */
export function IncomeBanner({ income, budgeted }: { income: number; budgeted: number }) {
  const gap = income - budgeted
  if (income <= 0 || Math.abs(gap) < 0.01) return null
  const over = gap < 0
  return (
    <Banner role="status">
      <WarningCircleIcon
        size={16}
        weight="fill"
        color={over ? color.warn : color.accent}
        style={{ flex: 'none', marginTop: 1 }}
      />
      <Copy>
        <Text variant="strong">
          {over ? `Budget is ${fmtDollars(-gap)} over income` : `${fmtDollars(gap)} of income unassigned`}
        </Text>
        <Text variant="label">
          {over
            ? 'Trim a few categories so your plan fits what’s coming in.'
            : 'Give it a job — add it to a category or savings.'}
        </Text>
      </Copy>
    </Banner>
  )
}
