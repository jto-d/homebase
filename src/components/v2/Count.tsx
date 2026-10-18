'use client'

import styled from '@emotion/styled'
import { color } from './tokens'

export const Count = styled.span({
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
})
