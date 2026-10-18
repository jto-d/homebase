'use client'

import styled from '@emotion/styled'
import { SidebarSimpleIcon } from '@phosphor-icons/react'
import { color, IconButton, Stack, Text } from '@/components/v2'
import { useSidebar } from './SidebarContext'

const Bar = styled.header({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  height: 44,
  padding: '0 16px',
  flex: 'none',
  borderBottom: `1px solid ${color.border}`,
})

const Group = styled(Stack)({ minWidth: 0, alignSelf: 'stretch' })

const Title = styled(Text)({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

const ExpandButton = styled(IconButton)({ marginLeft: -6 })

// Stretches to the bar's full height so a Tabs indicator sits on the bottom border.
const Nav = styled.div({ height: '100%', marginLeft: 8 })

export function PageHeader({
  title,
  tabs,
  actions,
}: {
  title: string
  tabs?: React.ReactNode
  actions?: React.ReactNode
}) {
  const { collapsed, toggle } = useSidebar()

  return (
    <Bar>
      <Group direction="row" align="center" gap={8}>
        {collapsed && (
          <ExpandButton onClick={toggle} aria-label="Expand sidebar">
            <SidebarSimpleIcon size={16} weight="bold" />
          </ExpandButton>
        )}
        <Title as="h1" variant="strong">
          {title}
        </Title>
        {tabs && <Nav>{tabs}</Nav>}
      </Group>
      {actions && (
        <Group direction="row" align="center" gap={8}>
          {actions}
        </Group>
      )}
    </Bar>
  )
}
