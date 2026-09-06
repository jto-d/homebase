'use client'

import Typography from '@mui/material/Typography'
import { ListRow, PanelHeader, Row, SurfaceCard } from '@/components/ui'
import type { BudgetTotals } from '@/lib/budget'
import { fmtDollars, fmtSigned } from '@/lib/format'
import { tabularNums } from '@/lib/sx'
import { brand } from '@/lib/theme'

/** Read-only breakdown of the month's budget total — editing happens in the ledger below. */
export function BudgetedPanel({ totals }: { totals: BudgetTotals }) {
  const { income, budgeted, savings, surplus } = totals
  const spending = budgeted - savings

  return (
    <SurfaceCard>
      <PanelHeader
        icon="wallet"
        title="Budgeted"
        subtitle={`${income > 0 ? Math.round((budgeted / income) * 100) : 0}% of income`}
      />

      <ListRow gap={1.25} sx={{ px: 2.25, py: 1.375 }}>
        <Typography variant="body" sx={{ flex: 1 }}>
          Savings
        </Typography>
        <Typography sx={{ fontWeight: 600, ...tabularNums }}>{fmtDollars(savings)}</Typography>
      </ListRow>
      <ListRow last gap={1.25} sx={{ px: 2.25, py: 1.375 }}>
        <Typography variant="body" sx={{ flex: 1 }}>
          Spending
        </Typography>
        <Typography sx={{ fontWeight: 600, ...tabularNums }}>{fmtDollars(spending)}</Typography>
      </ListRow>

      <Row
        align="baseline"
        justify="between"
        sx={{
          px: 2.5,
          py: 1.75,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50',
          borderRadius: '0 0 14px 14px',
        }}
      >
        <Typography variant="label" sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Unbudgeted income
        </Typography>
        <Typography sx={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', color: surplus < 0 ? brand.red[600] : 'text.primary', ...tabularNums }}>
          {fmtSigned(surplus)}
        </Typography>
      </Row>
    </SurfaceCard>
  )
}
