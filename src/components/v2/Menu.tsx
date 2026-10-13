'use client'

import { Menu as BaseMenu } from '@base-ui/react/menu'
import type { CSSObject } from '@emotion/react'
import styled from '@emotion/styled'
import { color, radius, shadow } from './tokens'

const Positioner = styled(BaseMenu.Positioner)({ outline: 0 })

const StyledPopup = styled(BaseMenu.Popup)({
  minWidth: 200,
  padding: 4,
  outline: 0,
  backgroundColor: color.surface,
  border: `1px solid ${color.border}`,
  borderRadius: radius.md,
  boxShadow: shadow.md,
  transformOrigin: 'var(--transform-origin)',
  transition: 'opacity 100ms ease-out, transform 100ms ease-out',
  '&[data-starting-style], &[data-ending-style]': { opacity: 0, transform: 'scale(0.98)' },
})

function Popup({ children, sideOffset = 4, align = 'start', ...props }: BaseMenu.Positioner.Props) {
  return (
    <BaseMenu.Portal>
      <Positioner sideOffset={sideOffset} align={align} {...props}>
        <StyledPopup>{children}</StyledPopup>
      </Positioner>
    </BaseMenu.Portal>
  )
}

const item: CSSObject = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  height: 30,
  padding: '0 8px',
  borderRadius: radius.sm,
  fontSize: 13,
  fontWeight: 500,
  color: color.text,
  textDecoration: 'none',
  cursor: 'default',
  outline: 0,
  userSelect: 'none',
  '& svg': { color: color.icon, flex: 'none' },
  '&[data-highlighted]': { backgroundColor: color.hover },
}

export const Menu = {
  Root: BaseMenu.Root,
  Trigger: BaseMenu.Trigger,
  Popup,
  Item: styled(BaseMenu.Item)(item),
  LinkItem: styled(BaseMenu.LinkItem)(item),
}
