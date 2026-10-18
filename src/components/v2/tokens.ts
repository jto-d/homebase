import type { CSSObject } from '@emotion/react'
import { brand } from '@/lib/theme'

export const color = {
  text: brand.zinc[950],
  textMuted: brand.zinc[600],
  icon: brand.zinc[500],
  iconHover: brand.zinc[900],
  border: brand.zinc[200],
  surface: '#fff',
  surfaceSunken: brand.zinc[50],
  hover: brand.zinc[100],
  selected: brand.zinc[200],
  accent: brand.teal[600],
  focus: brand.teal[500],
  warn: brand.amber[700],
  danger: brand.red[600],
} as const

export const radius = { sm: 4, md: 6, lg: 12 } as const

export const shadow = brand.shadow

export const focusRing: CSSObject = {
  '&:focus-visible': { outline: `2px solid ${color.focus}`, outlineOffset: -2 },
}

export const buttonReset: CSSObject = {
  appearance: 'none',
  margin: 0,
  padding: 0,
  border: 0,
  background: 'transparent',
  color: 'inherit',
  font: 'inherit',
  cursor: 'pointer',
  outline: 0,
  userSelect: 'none',
  ...focusRing,
}
