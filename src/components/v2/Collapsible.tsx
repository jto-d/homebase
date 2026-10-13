'use client'

import { Collapsible as BaseCollapsible } from '@base-ui/react/collapsible'
import styled from '@emotion/styled'
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

export const Collapsible = {
  Root,
  Trigger,
  Panel,
  Caret,
}
