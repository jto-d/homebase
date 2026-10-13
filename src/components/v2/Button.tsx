'use client'

import { Button as BaseButton } from '@base-ui/react/button'
import type { CSSObject } from '@emotion/react'
import styled from '@emotion/styled'
import { brand } from '@/lib/theme'
import { buttonReset, color, radius } from './tokens'

type Variant = 'primary' | 'subtle' | 'outline'

const VARIANTS: Record<Variant, CSSObject> = {
  primary: {
    backgroundColor: color.accent,
    color: '#fff',
    '&:hover:not([data-disabled])': { backgroundColor: brand.teal[700] },
    '&:active:not([data-disabled])': { backgroundColor: brand.teal[800] },
  },
  subtle: {
    backgroundColor: 'transparent',
    color: color.textMuted,
    '&:hover:not([data-disabled])': { backgroundColor: color.hover, color: color.text },
    '&:active:not([data-disabled])': { backgroundColor: color.selected },
  },
  outline: {
    backgroundColor: color.surface,
    color: color.text,
    border: `1px solid ${color.border}`,
    '&:hover:not([data-disabled])': { backgroundColor: color.hover },
    '&:active:not([data-disabled])': { backgroundColor: color.selected },
  },
}

export const Button = styled(BaseButton, {
  shouldForwardProp: (prop) => prop !== 'variant',
})<{ variant?: Variant }>(({ variant = 'primary' }) => ({
  ...buttonReset,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  height: 30,
  padding: '0 12px',
  borderRadius: radius.md,
  fontSize: 13,
  fontWeight: 500,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  ...VARIANTS[variant],
  '&[data-disabled]': { opacity: 0.5, cursor: 'not-allowed' },
}))
