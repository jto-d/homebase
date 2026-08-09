'use client'

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { monthLabel } from '@/lib/format'

export interface MonthSel {
  year: number
  month: number
}

/** The month containing today, 1-based. The default selection for both pages. */
export function currentMonth(): MonthSel {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

/** Step by whole months without landing on the 31st of a 30-day month. */
function step({ year, month }: MonthSel, delta: number): MonthSel {
  const ordinal = year * 12 + (month - 1) + delta
  return { year: Math.floor(ordinal / 12), month: (ordinal % 12) + 1 }
}

export function MonthStepper({
  value,
  onChange,
}: {
  value: MonthSel
  onChange: (next: MonthSel) => void
}) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'center' }}>
      <IconButton size="small" aria-label="Previous month" onClick={() => onChange(step(value, -1))}>
        <ChevronLeftIcon />
      </IconButton>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, minWidth: 160, textAlign: 'center' }}>
        {monthLabel(value.year, value.month)}
      </Typography>
      <IconButton size="small" aria-label="Next month" onClick={() => onChange(step(value, 1))}>
        <ChevronRightIcon />
      </IconButton>
    </Stack>
  )
}
