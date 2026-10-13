'use client'

import styled from '@emotion/styled'
import { SidebarSimpleIcon } from '@phosphor-icons/react'
import { color, IconButton, Stack } from '@/components/v2'
import { useSidebar } from './sidebar-context'

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

const Group = styled(Stack)({ minWidth: 0 })

const Title = styled.h1({
  margin: 0,
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1.4,
  letterSpacing: '-0.005em',
  color: color.text,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

const ExpandButton = styled(IconButton)({ marginLeft: -6 })

export function PageHeader({ title, actions }: { title: string; actions?: React.ReactNode }) {
  const { collapsed, toggle } = useSidebar()

  return (
    <Bar>
      <Group direction="row" align="center" gap={8}>
        {collapsed && (
          <ExpandButton onClick={toggle} aria-label="Expand sidebar">
            <SidebarSimpleIcon size={16} weight="bold" />
          </ExpandButton>
        )}
        <Title>{title}</Title>
      </Group>
      {actions && (
        <Group direction="row" align="center" gap={8}>
          {actions}
        </Group>
      )}
    </Bar>
  )
}
