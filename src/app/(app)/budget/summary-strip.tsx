'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Dot, Row, Stat, SurfaceCard, VDivider } from '@/components/ui'
import type { BudgetTotals } from '@/lib/budget'
import { fmtDollars, fmtSigned } from '@/lib/format'
import { brand } from '@/lib/theme'

const LEGEND = [
  { c: brand.teal[600], label: 'Spent' },
  { c: brand.teal[200], label: 'Budgeted, not yet spent' },
  { c: 'grey.200', label: 'Surplus' },
]

/** The four numbers that answer "how is this month going", over one stacked bar. */
export function SummaryStrip({ totals }: { totals: BudgetTotals }) {
  const { income, budgeted, spent, surplus, incomeCount } = totals
  const deficit = surplus < 0

  // Everything is a fraction of income, so the three segments and the empty
  // track together read as where the paycheck went.
  const segments =
    income > 0
      ? [
          { w: spent / income, c: brand.teal[600] },
          { w: Math.max(0, budgeted - spent) / income, c: brand.teal[200] },
        ]
      : []

  const cellSx = (hero?: boolean) => ({ flex: hero ? 1.1 : 1, px: { xs: 2, sm: 2.5 } })

  return (
    <SurfaceCard>
      <Row align="stretch" sx={{ py: 2.5, px: 1 }}>
        <Stat
          label="Income"
          value={fmtDollars(income)}
          sub={`${incomeCount} source${incomeCount !== 1 ? 's' : ''}`}
          sx={cellSx()}
        />
        <VDivider sx={{ my: 0.75 }} />
        <Stat
          label="Budgeted"
          value={fmtDollars(budgeted)}
          sub={`${income > 0 ? Math.round((budgeted / income) * 100) : 0}% of income`}
          sx={cellSx()}
        />
        <VDivider sx={{ my: 0.75 }} />
        <Stat
          label="Spent"
          value={fmtDollars(spent)}
          sub={`${budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0}% of budget`}
          sx={cellSx()}
        />
        <VDivider sx={{ my: 0.75 }} />
        <Stat
          hero
          label={deficit ? 'Deficit' : 'Surplus'}
          value={fmtSigned(surplus)}
          sub={deficit ? 'Over budget this month' : 'Left after everything budgeted'}
          color={deficit ? brand.red[600] : brand.teal[700]}
          sx={cellSx(true)}
        />
      </Row>

      <Box sx={{ px: 3.25, pb: 2.5 }}>
        <Row align="stretch" sx={{ height: 8, borderRadius: 999, overflow: 'hidden', bgcolor: 'grey.100' }}>
          {segments.map((s, i) =>
            s.w > 0 ? (
              <Box
                key={i}
                sx={{ width: `${Math.min(100, s.w * 100)}%`, bgcolor: s.c, transition: 'width 0.3s ease' }}
              />
            ) : null
          )}
        </Row>
        <Row gap={2.25} wrap sx={{ mt: 1.25 }}>
          {LEGEND.map(({ c, label }) => (
            <Row key={label} inline gap="7px">
              <Dot size={9} color={c} />
              <Typography variant="label" color="text.secondary">
                {label}
              </Typography>
            </Row>
          ))}
        </Row>
      </Box>
    </SurfaceCard>
  )
}
