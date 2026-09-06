'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { Dot, Row, Stat, SurfaceCard, VDivider } from '@/components/ui'
import type { MonthSel } from '@/lib/budget'
import { budgetPace, type BudgetTotals } from '@/lib/budget'
import { fmtDollars, fmtSigned } from '@/lib/format'
import { brand } from '@/lib/theme'

const LEGEND = [
  { c: brand.teal[600], label: 'Spent' },
  { c: brand.teal[200], label: 'Left to spend' },
]

/** The runway view: one hero number (what's left), spend pace against the days remaining. */
export function SummaryStrip({ totals, sel }: { totals: BudgetTotals; sel: MonthSel }) {
  const { budgeted, spent, spendingRemaining, surplus } = totals
  const { leftToSpend, daysLeft, perDay, overspent } = budgetPace(totals, sel)
  const unbudgeted = surplus // income minus budget — same number, different frame here

  const spentFrac = budgeted > 0 ? spent / budgeted : 0
  const leftFrac = budgeted > 0 ? Math.max(0, 1 - spentFrac) : 0

  const cellSx = { flex: 1, px: { xs: 2, sm: 2.5 } }

  return (
    <SurfaceCard>
      <Row align="stretch" sx={{ py: 2.5, px: 1 }}>
        <Stat
          label="Left to spend"
          value={fmtDollars(leftToSpend)}
          valueSize={40}
          color={brand.teal[700]}
          sub={
            <Row inline gap="8px">
              <span>{daysLeft} day{daysLeft !== 1 ? 's' : ''} to go</span>
              <Dot size={3} color="grey.300" />
              <span>{fmtDollars(perDay)} / day</span>
            </Row>
          }
          sx={{ ...cellSx, flex: 1.5 }}
        />
        <VDivider sx={{ my: 0.75 }} />
        <Stat
          label="Spending remaining"
          value={fmtSigned(spendingRemaining)}
          valueColor={spendingRemaining < 0 ? brand.red[600] : undefined}
          sub="outside savings"
          sx={cellSx}
        />
        <VDivider sx={{ my: 0.75 }} />
        <Stat
          label="Overspent so far"
          value={fmtDollars(overspent)}
          valueColor={overspent > 0 ? brand.amber[700] : undefined}
          sub="above an even pace"
          sx={cellSx}
        />
        <VDivider sx={{ my: 0.75 }} />
        <Stat
          label="Unbudgeted"
          value={fmtSigned(unbudgeted)}
          valueColor={unbudgeted < 0 ? brand.red[600] : undefined}
          sub="income minus budget"
          sx={cellSx}
        />
      </Row>

      <Box sx={{ px: 3.25, pb: 2.5 }}>
        <Row align="stretch" sx={{ height: 8, borderRadius: 999, overflow: 'hidden', bgcolor: 'grey.100' }}>
          {spentFrac > 0 && <Box sx={{ width: `${Math.min(100, spentFrac * 100)}%`, bgcolor: brand.teal[600] }} />}
          {leftFrac > 0 && <Box sx={{ width: `${leftFrac * 100}%`, bgcolor: brand.teal[200] }} />}
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
