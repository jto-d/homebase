'use client'

import styled from '@emotion/styled'
import type { CSSProperties } from 'react'

type StackProps = {
  direction?: 'row' | 'column'
  gap?: number
  align?: CSSProperties['alignItems']
  justify?: CSSProperties['justifyContent']
}

const STACK_PROPS = new Set(['direction', 'gap', 'align', 'justify'])

export const Stack = styled('div', {
  shouldForwardProp: (prop) => !STACK_PROPS.has(prop),
})<StackProps>(({ direction = 'column', gap = 0, align, justify }) => ({
  display: 'flex',
  flexDirection: direction,
  gap,
  alignItems: align,
  justifyContent: justify,
}))
