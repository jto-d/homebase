'use client'

import { useState } from 'react'
import styled from '@emotion/styled'
import { color } from '@/components/v2'
import { SidebarContext } from './sidebar-context'
import { V2Sidebar } from './sidebar'

const Root = styled.div({
  display: 'flex',
  height: '100vh',
  backgroundColor: color.surface,
  isolation: 'isolate',
})

const Main = styled.main({
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
  fontSize: 12,
})

export function V2Shell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <SidebarContext value={{ collapsed, toggle: () => setCollapsed((c) => !c) }}>
      <Root>
        <V2Sidebar />
        <Main>{children}</Main>
      </Root>
    </SidebarContext>
  )
}
