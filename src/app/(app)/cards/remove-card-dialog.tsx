'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { AppDialog, Row } from '@/components/ui'

export interface PendingRemove {
  id: string
  name: string
}

/** Confirms removing a card — cascades its perks and credit history. */
export function RemoveCardDialog({ card, onConfirm, onClose }: { card: PendingRemove | null; onConfirm: () => void; onClose: () => void }) {
  if (!card) return null

  return (
    <AppDialog open onClose={onClose} title="Remove this card?" width={400}>
      <Box sx={{ px: '22px', pb: '8px' }}>
        <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.6 }}>
          <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {card.name}
          </Box>{' '}
          and all its perks and credit history will be permanently deleted. This cannot be undone.
        </Typography>
      </Box>
      <Row justify="end" gap={1} sx={{ px: '22px', py: '18px' }}>
        <Button variant="outlined" size="small" onClick={onClose} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 500 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          size="small"
          onClick={onConfirm}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}
        >
          Remove
        </Button>
      </Row>
    </AppDialog>
  )
}
