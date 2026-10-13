'use client'

import styled from '@emotion/styled'
import type { CSSObject } from '@emotion/react'
import { color } from './tokens'

type Variant = 'body' | 'strong' | 'muted' | 'label' | 'heading'

const VARIANTS: Record<Variant, CSSObject> = {
  body: { fontSize: 13, fontWeight: 500, lineHeight: 1.45, color: color.text },
  strong: { fontSize: 13, fontWeight: 500, lineHeight: 1.4, letterSpacing: '-0.005em', color: color.text },
  muted: { fontSize: 13, fontWeight: 500, lineHeight: 1.45, color: color.textMuted },
  label: { fontSize: 12, fontWeight: 500, lineHeight: 1.4, color: color.textMuted },
  heading: { fontSize: 20, fontWeight: 600, lineHeight: 1.25, letterSpacing: '-0.015em', color: color.text },
}

export const Text = styled('span', {
  shouldForwardProp: (prop) => prop !== 'variant',
})<{ variant?: Variant }>(({ variant = 'body' }) => ({
  margin: 0,
  ...VARIANTS[variant],
}))
