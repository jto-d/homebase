'use client'

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { CatGlyph, EditableLabel, EditableMoney, ListRow, ProgressBar, Row } from '@/components/ui'
import { fmtDollars, fmtSigned } from '@/lib/format'
import { tabularNums } from '@/lib/sx'
import { brand } from '@/lib/theme'
import { COL_W } from './col-header'

interface LedgerRowProps {
  label: string
  icon: string
  budget: number
  spent: number
  ytd: number
  annualLimit: number | null
  /** Balance through the end of the previous month. 0 unless rollsOver. */
  carried: number
  rollsOver: boolean
  last?: boolean
  /** Omitted when the row has children — its budget is theirs, not its own. */
  onBudget?: (v: number) => void
  /** Present only on a savings leaf — types the transfer instead of showing derived spend. */
  onSpent?: (v: number) => void
  onAnnualLimit: (v: number) => void
  /** Omitted on a savings row — that already accrues via contributed/annualLimit. */
  onRollover?: (v: boolean) => void
  onRename: (v: string) => void
  onRemove: () => void
  /** Adds a "+" affordance — "add a line item to this category". */
  onAdd?: () => void
  expandable?: boolean
  collapsed?: boolean
  onToggleExpand?: () => void
  /** Visually nests this row under a parent (line items under a category). */
  indent?: boolean
}

/**
 * One category or line item.
 *
 * Spent is always read-only text: it is the sum of the transactions filed here,
 * so the way to change it is to file a transaction, not to type over it.
 */
export function LedgerRow({
  label,
  icon,
  budget,
  spent,
  ytd,
  annualLimit,
  carried,
  rollsOver,
  last,
  onBudget,
  onSpent,
  onAnnualLimit,
  onRollover,
  onRename,
  onRemove,
  onAdd,
  expandable,
  collapsed,
  onToggleExpand,
  indent,
}: LedgerRowProps) {
  // Carried folds into spent, not budget — a debt from last month reads as
  // already-spent this month, a banked surplus reads as spend below zero.
  const netSpent = spent - carried
  const remaining = budget - netSpent
  const over = remaining < -0.001
  const isSavings = annualLimit != null

  return (
    <ListRow
      last={last}
      direction="column"
      hover={!!expandable}
      onClick={onToggleExpand}
      sx={{ py: 1.375, pl: indent ? 5 : 2.5 }}
    >
      <Row gap={1}>
        <Row gap={1.375} min0 sx={{ flex: 1 }}>
          {expandable && (
            <ExpandMoreIcon
              sx={{
                fontSize: 16,
                color: 'text.secondary',
                flexShrink: 0,
                transform: collapsed ? 'rotate(-90deg)' : 'none',
                transition: 'transform 0.18s ease',
              }}
            />
          )}
          <CatGlyph icon={icon} size={indent ? 28 : 32} tone={isSavings ? 'accent' : 'neutral'} />
          <Box onClick={(e) => e.stopPropagation()} sx={{ minWidth: 0 }}>
            <EditableLabel value={label} onChange={onRename} size={14} weight={500} />
            {rollsOver && carried !== 0 && (
              <Typography sx={{ ...tabularNums, fontSize: 11, color: 'text.disabled' }}>
                {carried > 0 ? '+' : '−'}
                {fmtDollars(Math.abs(carried))} carried
              </Typography>
            )}
          </Box>
        </Row>

        <Row justify="end" gap={0.5} sx={{ width: COL_W }}>
          {onBudget ? (
            <EditableMoney value={budget} onChange={onBudget} weight={500} />
          ) : (
            <Typography sx={{ ...tabularNums, fontSize: 14, fontWeight: 500, color: 'text.primary' }}>
              {fmtDollars(budget)}
            </Typography>
          )}
        </Row>

        <Row justify="end" sx={{ width: COL_W }}>
          {onSpent ? (
            <EditableMoney value={spent} onChange={onSpent} weight={500} />
          ) : (
            <Typography sx={{ ...tabularNums, fontSize: 14, fontWeight: 500, color: 'text.disabled' }}>
              {rollsOver ? fmtSigned(netSpent) : fmtDollars(spent)}
            </Typography>
          )}
        </Row>

        <Row justify="end" sx={{ width: COL_W, pr: 1 }}>
          <Typography
            variant="bodyStrong"
            sx={{
              ...tabularNums,
              // Amber before red: "nearly out" is worth knowing a week early.
              color: over ? brand.red[600] : remaining < budget * 0.12 ? brand.amber[700] : 'text.secondary',
            }}
          >
            {fmtSigned(remaining)}
          </Typography>
        </Row>

        <Row gap={0.25} sx={{ minWidth: 28, justifyContent: 'center' }}>
          {onRollover && (
            <IconButton
              size="small"
              title={rollsOver ? 'Rolls over — unspent budget carries forward' : 'Rolls over'}
              onClick={(e) => {
                e.stopPropagation()
                onRollover(!rollsOver)
              }}
              sx={{
                width: 24,
                height: 24,
                borderRadius: '6px',
                color: rollsOver ? brand.teal[600] : 'text.disabled',
                bgcolor: rollsOver ? brand.teal[50] : 'transparent',
                '&:hover': { color: rollsOver ? brand.teal[700] : 'text.secondary', bgcolor: 'grey.100' },
              }}
            >
              <AutorenewIcon sx={{ fontSize: 15 }} />
            </IconButton>
          )}
          {onAdd && (
            <IconButton
              size="small"
              title="Add line item"
              onClick={(e) => {
                e.stopPropagation()
                onAdd()
              }}
              sx={{
                width: 24,
                height: 24,
                borderRadius: '6px',
                color: 'text.disabled',
                '&:hover': { color: 'text.secondary', bgcolor: 'grey.100' },
              }}
            >
              <AddIcon sx={{ fontSize: 15 }} />
            </IconButton>
          )}
          <IconButton
            size="small"
            title="Remove"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            sx={{
              width: 24,
              height: 24,
              borderRadius: '6px',
              color: 'text.disabled',
              '&:hover': { color: brand.red[500], bgcolor: brand.red[50] },
            }}
          >
            <DeleteOutlinedIcon sx={{ fontSize: 15 }} />
          </IconButton>
        </Row>
      </Row>

      {isSavings && <AnnualLimitBar ytd={ytd} annualLimit={annualLimit} onAnnualLimit={onAnnualLimit} />}
    </ListRow>
  )
}

/** Year-to-date against a contribution cap — the one thing a savings row adds. */
function AnnualLimitBar({
  ytd,
  annualLimit,
  onAnnualLimit,
}: {
  ytd: number
  annualLimit: number
  onAnnualLimit: (v: number) => void
}) {
  const ratio = annualLimit > 0 ? ytd / annualLimit : 0
  const barColor = ratio >= 1 ? brand.red[500] : ratio >= 0.85 ? brand.gold[500] : brand.teal[600]
  const textColor = ratio >= 1 ? brand.red[600] : ratio >= 0.85 ? brand.amber[700] : 'text.secondary'

  return (
    <Box sx={{ mt: 1, maxWidth: 340 }} onClick={(e) => e.stopPropagation()}>
      <Row justify="between" sx={{ mb: 0.5 }}>
        <Typography variant="note" color="text.disabled">
          Annual limit · YTD
        </Typography>
        <Row gap="2px">
          <Typography variant="note" sx={{ color: textColor, fontWeight: 600, ...tabularNums }}>
            {fmtDollars(ytd)} of
          </Typography>
          <EditableMoney value={annualLimit} onChange={onAnnualLimit} size={11} weight={600} />
        </Row>
      </Row>
      <ProgressBar value={ratio} color={barColor} thin sx={{ height: 4 }} />
    </Box>
  )
}
