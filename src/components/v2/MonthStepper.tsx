'use client'

import styled from '@emotion/styled'
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react'
import { currentMonth, step } from '@/components/MonthStepper'
import { monthOrdinal, type MonthSel } from '@/lib/budget'
import { monthLabel } from '@/lib/format'
import { IconButton } from './IconButton'
import { Text } from './Text'

const Frame = styled.div({ display: 'inline-flex', alignItems: 'center' })

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
  '&[data-disabled]': { opacity: 0.3, cursor: 'not-allowed', backgroundColor: 'transparent' },
})

/** `◀ October 2026 ▶`, capped a year out like v1's stepper. */
export function MonthStepper({ value, onChange }: { value: MonthSel; onChange: (next: MonthSel) => void }) {
  const atEnd = monthOrdinal(value) >= monthOrdinal(step(currentMonth(), 12))

  return (
    <Frame>
      <Arrow aria-label="Previous month" onClick={() => onChange(step(value, -1))}>
        <CaretLeftIcon size={12} weight="bold" />
      </Arrow>
      <Label variant="strong">{monthLabel(value.year, value.month)}</Label>
      <Arrow aria-label="Next month" disabled={atEnd} onClick={() => onChange(step(value, 1))}>
        <CaretRightIcon size={12} weight="bold" />
      </Arrow>
    </Frame>
  )
}
