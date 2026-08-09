'use client'

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import { EditableLabel, EditableMoney, ListRow, PanelHeader, Row, SurfaceCard } from '@/components/ui'
import { fmtDollars } from '@/lib/format'
import { tabularNums } from '@/lib/sx'
import { brand } from '@/lib/theme'

export interface IncomeRow {
  id: string
  label: string
  sub: string | null
  amount: number
}

export function IncomePanel({
  income,
  total,
  onSetAmount,
  onRename,
  onAdd,
  onRemove,
}: {
  income: IncomeRow[]
  total: number
  onSetAmount: (id: string, v: number) => void
  onRename: (id: string, label: string) => void
  onAdd: () => void
  onRemove: (id: string) => void
}) {
  return (
    <SurfaceCard>
      <PanelHeader
        icon="wallet"
        title="Income"
        subtitle="Net, monthly"
        action={
          <IconButton
            size="small"
            title="Add income source"
            onClick={onAdd}
            sx={{ width: 30, height: 30, borderRadius: '7px', color: 'text.secondary' }}
          >
            <AddIcon sx={{ fontSize: 17 }} />
          </IconButton>
        }
      />

      {income.map((src, i) => (
        <ListRow key={src.id} last={i === income.length - 1} gap={1.25} sx={{ px: 2.25, py: 1.375 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <EditableLabel value={src.label} onChange={(label) => onRename(src.id, label)} size={14} weight={600} />
            {src.sub && (
              <Typography variant="note" color="text.disabled" sx={{ mt: '2px' }}>
                {src.sub}
              </Typography>
            )}
          </Box>
          <EditableMoney value={src.amount} onChange={(v) => onSetAmount(src.id, v)} weight={600} />
          <IconButton
            size="small"
            title="Remove"
            onClick={() => onRemove(src.id)}
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
        </ListRow>
      ))}

      {income.length === 0 && (
        <Box sx={{ px: 2.25, py: 3.5, textAlign: 'center' }}>
          <Typography variant="body" color="text.disabled">
            No income yet. Add a source to start.
          </Typography>
        </Box>
      )}

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
          Total monthly income
        </Typography>
        <Typography sx={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em', ...tabularNums }}>
          {fmtDollars(total)}
        </Typography>
      </Row>
    </SurfaceCard>
  )
}
