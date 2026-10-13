'use client'

import styled from '@emotion/styled'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { monthOrdinal } from '@/lib/budget'
import { monthLabel } from '@/lib/format'
import { IconButton } from './IconButton'
import { Text } from './Text'
import { color, radius } from './tokens'

export type MonthSel = { year: number; month: number }

export function currentMonth(): MonthSel {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

export function step({ year, month }: MonthSel, delta: number): MonthSel {
  const next = monthOrdinal({ year, month }) + delta
  return { year: Math.floor(next / 12), month: (next % 12) + 1 }
}

const Frame = styled.div({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 0,
  borderRadius: radius.md,
})

const Label = styled(Text)({
  minWidth: 108,
  textAlign: 'center',
  fontVariantNumeric: 'tabular-nums',
  userSelect: 'none',
  padding: '0 2px',
})

const Arrow = styled(IconButton)({
  width: 22,
  height: 22,
  color: color.icon,
  '&:hover:not([data-disabled])': { backgroundColor: color.hover, color: color.iconHover },
  '&[data-disabled]': { opacity: 0.3, cursor: 'not-allowed' },
})

export function MonthStepper({
  value,
  onChange,
  min,
  max,
}: {
  value: MonthSel
  onChange: (next: MonthSel) => void
  min?: MonthSel | null
  max?: MonthSel | null
}) {
  const here = monthOrdinal(value)
  const atStart = min != null && here <= monthOrdinal(min)
  const atEnd = here >= monthOrdinal(max ?? step(currentMonth(), 12))

  return (
    <Frame>
      <Arrow
        aria-label="Previous month"
        disabled={atStart}
        onClick={() => onChange(step(value, -1))}
      >
        <CaretLeftIcon size={12} weight="bold" />
      </Arrow>
      <Label variant="strong">{monthLabel(value.year, value.month)}</Label>
      <Arrow
        aria-label="Next month"
        disabled={atEnd}
        onClick={() => onChange(step(value, 1))}
      >
        <CaretRightIcon size={12} weight="bold" />
      </Arrow>
    </Frame>
  )
}
