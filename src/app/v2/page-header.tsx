'use client'

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { SidebarSimpleIcon } from '@phosphor-icons/react'
import { brand } from '@/lib/theme'
import { useSidebar } from './sidebar-context'

export function PageHeader({ title, actions }: { title: string; actions?: React.ReactNode }) {
  const { collapsed, toggle } = useSidebar()

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
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        {collapsed && (
          <IconButton
            disableRipple
            size="small"
            onClick={toggle}
            aria-label="Expand sidebar"
            sx={{ borderRadius: '6px', color: brand.zinc[500], ml: -0.75, '&:hover': { bgcolor: brand.zinc[100], color: brand.zinc[900] } }}
          >
            <SidebarSimpleIcon size={16} weight="bold" />
          </IconButton>
        )}
        <Typography variant="bodyStrong" sx={{ fontSize: 13, fontWeight: 500 }} noWrap>
          {title}
        </Typography>
      </Box>
      {actions && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{actions}</Box>}
    </Box>
  )
}
