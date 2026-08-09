'use client'

import Box from '@mui/material/Box'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import { Row } from '../layout/Flex'

export function AppDialog({
  open,
  onClose,
  title,
  subtitle,
  width = 440,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  width?: number
  children: React.ReactNode
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      slotProps={{
        paper: {
          sx: {
            width,
            maxHeight: 'calc(100vh - 48px)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <Row align="start" justify="between" sx={{ p: '20px 22px 14px', flex: 'none' }}>
        <Box>
          <Typography
            component="h2"
            sx={{ m: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-0.015em', color: 'text.primary' }}
          >
            {title}
          </Typography>
          {subtitle && <Typography sx={{ mt: '4px', fontSize: 13, color: 'grey.500' }}>{subtitle}</Typography>}
        </Box>
        <IconButton
          onClick={onClose}
          aria-label="Close"
          sx={{
            color: 'text.disabled',
            mt: '-2px',
            mr: '-6px',
            '&:hover': { bgcolor: 'grey.100', color: 'text.secondary' },
          }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Row>
      {children}
    </Dialog>
  )
}
