'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

export function PageHeader({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        height: 44,
        px: 2,
        flex: 'none',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Typography variant="bodyStrong" sx={{ fontSize: 13, fontWeight: 500 }} noWrap>
        {title}
      </Typography>
      {actions && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{actions}</Box>}
    </Box>
  )
}
