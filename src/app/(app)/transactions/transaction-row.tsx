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
  partner: Member | null
  currentPath: string | null
  categoryGroups: CategoryGroup[]
  onSetCategory: (path: string | null) => void
  onSetShared: (shared: boolean | null) => void
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
  partner,
  currentPath,
  categoryGroups,
  onSetCategory,
  onSetShared,
  onDelete,
  last,
}: TransactionRowProps) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null)
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

        {/* Split / File — only once a category is set, and only with a partner */}
        {hasCategory && partner && txn.shared == null && (
          <>
            <Box
              component="button"
              onClick={() => onSetShared(true)}
              sx={{ ...chipBase, px: '11px', py: '5px', borderColor: 'divider', bgcolor: '#fff', color: 'text.secondary', fontWeight: 500 }}
            >
              <AddIcon sx={{ fontSize: 13 }} />
              Split 50/50
            </Box>
            <Box
              component="button"
              onClick={() => onSetShared(false)}
              sx={{ ...chipBase, px: '11px', py: '5px', borderColor: 'divider', bgcolor: '#fff', color: 'text.secondary', fontWeight: 500 }}
            >
              File
            </Box>
          </>
        )}
        {hasCategory && partner && txn.shared === true && (
          <Box
            component="button"
            onClick={() => onSetShared(null)}
            title="Click to undo the split"
            sx={{ ...chipBase, px: '10px', py: '4px', borderColor: 'divider', bgcolor: '#fff', color: 'text.primary', fontWeight: 600 }}
          >
            <MemberAvatar member={partner} size={19} />
            Split 50/50
          </Box>
        )}
        {hasCategory && partner && txn.shared === false && (
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
