'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { AppDialog, Row } from '@/components/ui'

export interface PendingDelete {
  id: string
  label: string
  childCount: number
}

/**
 * Confirms deleting a node and everything under it. Used at every depth — a
 * line item takes nothing with it, a group can take a dozen rows.
 */
export function DeleteNodeDialog({
  node,
  onConfirm,
  onClose,
}: {
  node: PendingDelete | null
  onConfirm: () => void
  onClose: () => void
}) {
  if (!node) return null

  const bold = (text: string) => (
    <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
      {text}
    </Box>
  )

  return (
    <AppDialog open onClose={onClose} title="Delete this?" width={400}>
      <Box sx={{ px: '22px', pb: '8px' }}>
        <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.6 }}>
          {bold(node.label)}
          {node.childCount > 0 && (
            <>
              {' '}and{' '}
              {bold(node.childCount === 1 ? '1 item inside it' : `${node.childCount} items inside it`)}
            </>
          )}{' '}
          will be permanently deleted. This cannot be undone.
        </Typography>
      </Box>
      <Row justify="end" gap={1} sx={{ px: '22px', py: '18px' }}>
        <Button
          variant="outlined"
          size="small"
          onClick={onClose}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={onConfirm}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            bgcolor: 'error.main',
            '&:hover': { bgcolor: 'error.dark' },
          }}
        >
          Delete
        </Button>
      </Row>
    </AppDialog>
  )
}
