'use client'

import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { Row } from '@/components/ui'
import { monthOrdinal } from '@/lib/budget'
import { monthLabel } from '@/lib/format'
import { tabularNums } from '@/lib/sx'
import { brand } from '@/lib/theme'

export interface MonthSel {
  year: number
  month: number
}

/** The month containing today, 1-based. The default selection for every page. */
export function currentMonth(): MonthSel {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

/** Step by whole months without landing on the 31st of a 30-day month. */
export function step({ year, month }: MonthSel, delta: number): MonthSel {
  const next = monthOrdinal({ year, month }) + delta
  return { year: Math.floor(next / 12), month: (next % 12) + 1 }
}

/**
 * `◀ October 2026 ▶`.
 *
 * `max` defaults to a year out: a budget you can page forward into forever is a
 * budget with no edge, and every month past the next twelve is speculation.
 */
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

  const arrowSx = (disabled: boolean) => ({
    width: 32,
    height: 32,
    borderRadius: '7px',
    color: disabled ? 'text.disabled' : 'text.secondary',
    '&:hover': {
      bgcolor: disabled ? 'transparent' : '#fff',
      boxShadow: disabled ? 'none' : brand.shadow.sm,
    },
  })

  return (
    <Row
      inline
      gap="2px"
      sx={{
        p: '3px',
        bgcolor: 'grey.100',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '9px',
      }}
    >
      <IconButton
        size="small"
        aria-label="Previous month"
        disabled={atStart}
        onClick={() => onChange(step(value, -1))}
        sx={arrowSx(atStart)}
      >
        <ChevronLeftIcon sx={{ fontSize: 17 }} />
      </IconButton>
      <Typography variant="bodyStrong" sx={{ minWidth: 130, textAlign: 'center', ...tabularNums }}>
        {monthLabel(value.year, value.month)}
      </Typography>
      <IconButton
        size="small"
        aria-label="Next month"
        disabled={atEnd}
        onClick={() => onChange(step(value, 1))}
        sx={arrowSx(atEnd)}
      >
        <ChevronRightIcon sx={{ fontSize: 17 }} />
      </IconButton>
    </Row>
  )
}
