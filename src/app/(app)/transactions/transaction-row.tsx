'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import CheckIcon from '@mui/icons-material/CheckOutlined'
import AddIcon from '@mui/icons-material/AddOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreOutlined'
import { ListRow, Row, Stack } from '@/components/ui'
import { MemberAvatar } from '@/components/MemberAvatar'
import type { Member } from '@/components/MemberAvatar'
import { brand } from '@/lib/theme'
import { fmtDay, fmtMoney } from '@/lib/format'
import { tabularNums } from '@/lib/sx'
import type { TransactionsMonthQuery } from '@/gql/graphql'

type Txn = TransactionsMonthQuery['transactions'][number]

/** Budget paths grouped by their first segment, for the category menu. */
export interface CategoryGroup {
  group: string
  paths: string[]
}

interface TransactionRowProps {
  txn: Txn
  payerLabel: string
  accountLabel: string | null
  /** The other household member for this transaction — whoever didn't pay. Null while solo. */
  counterparty: Member | null
  currentPath: string | null
  /** The counterparty's current share in dollars, or null if undecided/not split. */
  counterpartyAmount: number | null
  categoryGroups: CategoryGroup[]
  onSetCategory: (path: string | null) => void
  onSetShared: (shared: boolean | null) => void
  onOpenSplit: () => void
  onDelete: () => void
  last?: boolean
}

const chipBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  border: '1px solid',
  borderRadius: '999px',
  fontFamily: 'inherit',
  fontSize: 12.5,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
} as const

export function TransactionRow({
  txn,
  payerLabel,
  accountLabel,
  counterparty,
  currentPath,
  counterpartyAmount,
  categoryGroups,
  onSetCategory,
  onSetShared,
  onOpenSplit,
  onDelete,
  last,
}: TransactionRowProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
  const [splitMenuAnchor, setSplitMenuAnchor] = useState<HTMLElement | null>(null)
  const hasCategory = currentPath != null

  return (
    <ListRow last={last} hover sx={{ gap: 2 }}>
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {txn.merchant}
        </Typography>
        <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
          {fmtDay(txn.date)} · {payerLabel}
          {accountLabel && ` · ${accountLabel}`}
        </Typography>
      </Stack>

      <Row gap={0.75} sx={{ flex: 'none', flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
        {/* Budget category */}
        <Box
          component="button"
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          sx={{
            ...chipBase,
            px: hasCategory ? '10px' : '11px',
            py: '5px',
            borderColor: hasCategory ? 'transparent' : 'divider',
            bgcolor: hasCategory ? brand.accentSoft : '#fff',
            color: hasCategory ? brand.teal[700] : 'text.secondary',
            fontWeight: hasCategory ? 600 : 500,
          }}
        >
          {hasCategory ? <CheckIcon sx={{ fontSize: 13 }} /> : <AddIcon sx={{ fontSize: 13 }} />}
          {hasCategory ? currentPath : 'Budget'}
          {hasCategory && <ExpandMoreIcon sx={{ fontSize: 14, opacity: 0.7 }} />}
        </Box>
        <Menu anchorEl={menuAnchor} open={menuAnchor != null} onClose={() => setMenuAnchor(null)}>
          {categoryGroups.flatMap((g) => [
            <MenuItem key={`${g.group}-label`} disabled divider sx={{ opacity: '1 !important' }}>
              <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                {g.group}
              </Typography>
            </MenuItem>,
            ...g.paths.map((path) => (
              <MenuItem
                key={path}
                selected={path === currentPath}
                onClick={() => {
                  onSetCategory(path === currentPath ? null : path)
                  setMenuAnchor(null)
                }}
              >
                {path.includes('›') ? path.split('›').slice(1).join('›').trim() : path}
              </MenuItem>
            )),
          ])}
          {hasCategory && (
            <MenuItem
              onClick={() => {
                onSetCategory(null)
                setMenuAnchor(null)
              }}
              sx={{ color: 'error.main' }}
            >
              Clear budget
            </MenuItem>
          )}
        </Menu>

        {/* Split / File — only once a category is set, and only with a counterparty */}
        {hasCategory && counterparty && txn.shared == null && (
          <>
            <Box
              component="button"
              onClick={(e) => setSplitMenuAnchor(e.currentTarget)}
              sx={{ ...chipBase, px: '11px', py: '5px', borderColor: 'divider', bgcolor: '#fff', color: 'text.secondary', fontWeight: 500 }}
            >
              <AddIcon sx={{ fontSize: 13 }} />
              Split 50/50
              <ExpandMoreIcon sx={{ fontSize: 14, opacity: 0.7 }} />
            </Box>
            <Menu anchorEl={splitMenuAnchor} open={splitMenuAnchor != null} onClose={() => setSplitMenuAnchor(null)}>
              <MenuItem
                onClick={() => {
                  onSetShared(true)
                  setSplitMenuAnchor(null)
                }}
              >
                50/50
              </MenuItem>
              <MenuItem
                onClick={() => {
                  onOpenSplit()
                  setSplitMenuAnchor(null)
                }}
              >
                Custom…
              </MenuItem>
            </Menu>
            <Box
              component="button"
              onClick={() => onSetShared(false)}
              sx={{ ...chipBase, px: '11px', py: '5px', borderColor: 'divider', bgcolor: '#fff', color: 'text.secondary', fontWeight: 500 }}
            >
              File
            </Box>
          </>
        )}
        {hasCategory && counterparty && txn.shared === true && (
          <Box
            component="button"
            onClick={onOpenSplit}
            title="Click to change the split"
            sx={{ ...chipBase, px: '10px', py: '4px', borderColor: 'divider', bgcolor: '#fff', color: 'text.primary', fontWeight: 600 }}
          >
            <MemberAvatar member={counterparty} size={19} />
            {Math.abs((counterpartyAmount ?? 0) - txn.amount / 2) < 0.01
              ? 'Split 50/50'
              : Math.abs((counterpartyAmount ?? 0) - txn.amount) < 0.01
                ? `${payerLabel} owes nothing`
                : fmtMoney(counterpartyAmount ?? 0)}
          </Box>
        )}
        {hasCategory && counterparty && txn.shared === false && (
          <Box
            component="button"
            onClick={() => onSetShared(null)}
            title="Click to undo"
            sx={{ ...chipBase, px: '11px', py: '5px', borderColor: 'divider', bgcolor: '#fff', color: 'text.secondary', fontWeight: 500 }}
          >
            Not split
          </Box>
        )}
      </Row>

      <Typography variant="body2" sx={{ width: 96, textAlign: 'right', fontWeight: 600, ...tabularNums }}>
        {fmtMoney(txn.amount)}
      </Typography>

      <IconButton size="small" aria-label={`Delete ${txn.merchant}`} onClick={onDelete}>
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </ListRow>
  )
}
