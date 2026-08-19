'use client'

import Chip from '@mui/material/Chip'
import { brand } from '@/lib/theme'
import type { StatusKey } from '@/lib/perk'
import type { VerdictKey } from '@/lib/card'

const CHIP_SX: Record<StatusKey | VerdictKey, { bgcolor: string; color: string }> = {
  captured: { bgcolor: brand.accentSoft, color: brand.teal[700] },
  partial: { bgcolor: brand.accentSoft, color: brand.teal[700] },
  expiring: { bgcolor: brand.amber[50], color: brand.amber[700] },
  open: { bgcolor: brand.zinc[100], color: brand.zinc[600] },
  ongoing: { bgcolor: brand.accentSoft, color: brand.teal[700] },
  worthIt: { bgcolor: brand.accentSoft, color: brand.teal[700] },
  marginal: { bgcolor: brand.amber[50], color: brand.amber[700] },
  reviewIt: { bgcolor: brand.red[50], color: brand.red[600] },
  noFee: { bgcolor: brand.zinc[100], color: brand.zinc[600] },
}

/** Status pill mapping a perk's StatusKey or a card's VerdictKey to brand colors. */
export function StatusChip({
  status,
  label,
  icon,
}: {
  status: StatusKey | VerdictKey
  label: string
  icon?: React.ReactElement
}) {
  return (
    <Chip
      size="small"
      label={label}
      icon={icon}
      sx={{
        height: 24,
        fontSize: 12,
        borderRadius: 999,
        ...CHIP_SX[status],
        '& .MuiChip-icon': { color: 'inherit', fontSize: 14, ml: '6px', mr: '-3px' },
        '& .MuiChip-label': { px: '10px' },
      }}
    />
  )
}
