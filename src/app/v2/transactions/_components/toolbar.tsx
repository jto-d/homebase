'use client'

import styled from '@emotion/styled'
import { BankIcon, FunnelSimpleIcon, PlusIcon } from '@phosphor-icons/react'
import { Button, MonthStepper, Stack } from '@/components/v2'
import type { MonthSel } from '@/lib/budget'

const Bar = styled.div({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
  height: 36,
  padding: '0 12px 0 16px',
  flex: 'none',
})

export function Toolbar({ month, onMonthChange }: { month: MonthSel; onMonthChange: (next: MonthSel) => void }) {
  return (
    <Bar>
      <MonthStepper value={month} onChange={onMonthChange} />
      <Stack direction="row" align="center" gap={2}>
        <Button variant="subtle">
          <FunnelSimpleIcon size={14} weight="bold" />
          Filter
        </Button>
        <Button variant="subtle">
          <BankIcon size={14} weight="bold" />
          Link a bank
        </Button>
        <Button variant="subtle">
          <PlusIcon size={14} weight="bold" />
          Add
        </Button>
      </Stack>
    </Bar>
  )
}
