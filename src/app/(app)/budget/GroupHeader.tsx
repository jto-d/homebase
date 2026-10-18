'use client'

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { CatGlyph, EditableLabel, ProgressBar, Row } from '@/components/ui'
import { fmtDollars } from '@/lib/format'
import { tabularNums } from '@/lib/sx'
import { brand } from '@/lib/theme'

/** The grey band that opens a group. Its money is the sum of the group's rows. */
export function GroupHeader({
  label,
  icon,
  childCount,
  spent,
  budget,
  collapsed,
  onToggle,
  onAdd,
  onRename,
  onRemove,
}: {
  label: string
  icon: string
  childCount: number
  spent: number
  budget: number
  collapsed: boolean
  onToggle: () => void
  onAdd: () => void
  onRename: (label: string) => void
  onRemove: () => void
}) {
  const ratio = budget > 0 ? spent / budget : 0
  const over = spent - budget > 0.001

  return (
    <Row
      onClick={onToggle}
      gap={1}
      sx={{
        cursor: 'pointer',
        px: 2.5,
        py: 1.5,
        bgcolor: 'grey.50',
        borderBottom: '1px solid',
        borderTop: '1px solid',
        borderColor: 'divider',
        '&:hover': { bgcolor: 'grey.100' },
        transition: 'background 0.15s ease',
      }}
    >
      <ExpandMoreIcon
        sx={{
          fontSize: 16,
          color: 'text.secondary',
          flexShrink: 0,
          transform: collapsed ? 'rotate(-90deg)' : 'none',
          transition: 'transform 0.18s ease',
        }}
      />
      <CatGlyph icon={icon} size={26} />
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 0.75 }}>
        {/* The label is editable, but clicking it must not also collapse the group. */}
        <Box onClick={(e) => e.stopPropagation()}>
          <EditableLabel value={label} onChange={onRename} size={13} weight={700} />
        </Box>
        <Box component="span" sx={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', color: 'text.disabled' }}>
          {childCount}
        </Box>
      </Box>
      <Row gap={1.5}>
        <Typography variant="label" sx={{ color: over ? brand.red[600] : 'text.secondary', ...tabularNums }}>
          {fmtDollars(spent)}{' '}
          <Box component="span" sx={{ color: 'text.disabled' }}>/ {fmtDollars(budget)}</Box>
        </Typography>
        <Box sx={{ width: 52 }}>
          <ProgressBar value={ratio} color={over ? brand.red[500] : brand.teal[600]} thin />
        </Box>
        <IconButton
          size="small"
          title="Add category"
          onClick={(e) => {
            e.stopPropagation()
            onAdd()
          }}
          sx={{ width: 28, height: 28, borderRadius: '7px', color: 'text.secondary' }}
        >
          <AddIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <IconButton
          size="small"
          title="Delete group"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          sx={{
            width: 28,
            height: 28,
            borderRadius: '7px',
            color: 'text.disabled',
            '&:hover': { color: brand.red[500], bgcolor: brand.red[50] },
          }}
        >
          <DeleteOutlinedIcon sx={{ fontSize: 15 }} />
        </IconButton>
      </Row>
    </Row>
  )
}
