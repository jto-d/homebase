'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import { SidebarContext } from './sidebar-context'
import { V2Sidebar } from './sidebar'

export function V2Shell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <SidebarContext value={{ collapsed, toggle: () => setCollapsed((c) => !c) }}>
      <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#fff' }}>
        <V2Sidebar />
        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto',
            fontSize: 12,
          }}
        >
          {children}
        </Box>
      </Box>
    </SidebarContext>
  )
}
