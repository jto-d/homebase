'use client'

import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible'
import styled from '@emotion/styled'
import { CaretRightIcon } from '@phosphor-icons/react'
import { Count } from './Count'
import { Text } from './Text'
import { buttonReset, color, radius } from './tokens'

const Root = styled(BaseCollapsible.Root)({
  margin: '0 8px 4px',
})

const Trigger = styled(BaseCollapsible.Trigger)({
  ...buttonReset,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  width: '100%',
  height: 30,
  padding: '0 8px',
  borderRadius: radius.md,
  fontSize: 13,
  fontWeight: 500,
  color: color.textMuted,
  backgroundColor: color.hover,
  '&:hover': { color: color.text },
})

const Panel = styled(BaseCollapsible.Panel)({
  height: 'var(--collapsible-panel-height)',
  overflow: 'hidden',
  transition: 'height 150ms ease-out',
  '&[data-starting-style], &[data-ending-style]': { height: 0 },
  "&[hidden]:not([hidden='until-found'])": { display: 'none' },
})

const Caret = styled.span({
  display: 'inline-grid',
  placeItems: 'center',
  flex: 'none',
  width: 14,
  height: 14,
  color: color.icon,
  transition: 'transform 120ms ease-out',
  '[data-panel-open] > &': { transform: 'rotate(90deg)' },
})

/** Collapsible group: caret, title and count header over its rows. */
export function Section({
  title,
  count,
  defaultOpen = true,
  children,
}: {
  title: string
  count: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <Root defaultOpen={defaultOpen}>
      <Trigger>
        <Caret>
          <CaretRightIcon size={12} weight="bold" />
        </Caret>
        {title}
        <Count>{count}</Count>
      </Trigger>
      <Panel>{children}</Panel>
    </Root>
  )
}

// Indented to line up with a Section title, past the caret.
const Note = styled.div({ padding: '8px 8px 12px 28px' })

/** Muted one-liner for an empty or failed list. */
export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <Note>
      <Text variant="muted">{children}</Text>
    </Note>
  )
}
