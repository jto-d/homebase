'use client'

import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import styled from '@emotion/styled'
import { buttonReset, color } from './tokens'

const List = styled(BaseTabs.List)({
  display: 'flex',
  position: 'relative',
  alignItems: 'stretch',
  gap: 2,
  height: '100%',
})

const Tab = styled(BaseTabs.Tab)({
  ...buttonReset,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  height: '100%',
  padding: '0 10px',
  fontSize: 13,
  fontWeight: 500,
  color: color.textMuted,
  whiteSpace: 'nowrap',
  '&:hover': { color: color.text },
  '&[data-active]': { color: color.text },
})

const Indicator = styled(BaseTabs.Indicator)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  height: 2,
  width: 'var(--active-tab-width)',
  translate: 'var(--active-tab-left) 0',
  backgroundColor: color.text,
  borderRadius: 1,
  transition: 'translate 150ms ease, width 150ms ease',
})

const Count = styled.span({
  display: 'inline-grid',
  placeItems: 'center',
  minWidth: 18,
  height: 18,
  padding: '0 5px',
  borderRadius: 4,
  backgroundColor: color.hover,
  color: color.textMuted,
  fontSize: 11,
  fontWeight: 600,
  fontVariantNumeric: 'tabular-nums',
  '[data-active] > &': { backgroundColor: color.selected, color: color.text },
})

export const Tabs = {
  Root: BaseTabs.Root,
  List,
  Tab,
  Indicator,
  Count,
}
