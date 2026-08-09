'use client'

import type { CSSProperties } from 'react'
import { createTheme } from '@mui/material/styles'

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    subtle: true
  }
}

/** Shared text scale (see `typography` below) — additive custom variants. */
type CustomTextVariant =
  | 'statXl'
  | 'statLg'
  | 'cardTitle'
  | 'panelTitle'
  | 'bodyStrong'
  | 'body'
  | 'label'
  | 'note'
  | 'micro'

declare module '@mui/material/styles' {
  interface TypographyVariants extends Record<CustomTextVariant, CSSProperties> {}
  interface TypographyVariantsOptions extends Partial<Record<CustomTextVariant, CSSProperties>> {}
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides extends Record<CustomTextVariant, true> {}
}

const zinc = {
  50: '#FAFAFA',
  100: '#F4F4F5',
  200: '#E4E4E7',
  300: '#D4D4D8',
  400: '#A1A1AA',
  500: '#71717A',
  600: '#52525B',
  700: '#3F3F46',
  800: '#27272A',
  900: '#18181B',
  950: '#09090B',
}

const teal = {
  50: '#E9F6F6',
  100: '#CBEBEB',
  200: '#97D8D7',
  300: '#5BC1C0',
  400: '#29A8A6',
  500: '#119290',
  600: '#0D7A78',
  700: '#0B6360',
  800: '#094F4D',
  900: '#083E3C',
}

/**
 * Raw brand values for the handful of spots that need them directly (progress
 * bar fills, over-budget text, shadows). Everything else flows through the MUI
 * theme below.
 *
 * `teal` is the same scale `MEMBER_COLOR_HEX.teal` points at — 500 is the shared
 * hue. Member colors stay in `lib/members.ts`; this is the app's chrome.
 */
export const brand = {
  zinc,
  teal,
  amber: { 50: '#FEF6E7', 700: '#A6630A' },
  gold: { 50: '#FFF8EB', 500: '#F59E0B' },
  red: { 50: '#FDECEC', 300: '#FCA5A5', 500: '#EF4444', 600: '#D03036' },
  accentSoft: teal[50],
  shadow: {
    sm: '0 1px 2px rgba(16,24,32,.04), 0 1px 3px rgba(16,24,32,.06)',
    md: '0 4px 14px -4px rgba(16,24,32,.10), 0 2px 6px -2px rgba(16,24,32,.06)',
    lg: '0 18px 40px -12px rgba(16,24,32,.16)',
  },
} as const

export const theme = createTheme({
  palette: {
    primary: { main: teal[700], dark: teal[800], light: teal[300], contrastText: '#fff' },
    success: { main: teal[600], light: teal[50], contrastText: '#fff' },
    warning: { main: brand.amber[700], light: brand.amber[50] },
    error: { main: brand.red[600], light: brand.red[50] },
    background: { default: zinc[50], paper: '#FFFFFF' },
    text: { primary: zinc[950], secondary: zinc[600], disabled: zinc[400] },
    divider: zinc[200],
    grey: {
      50: zinc[50],
      100: zinc[100],
      200: zinc[200],
      300: zinc[300],
      400: zinc[400],
      500: zinc[500],
      600: zinc[600],
      700: zinc[700],
      800: zinc[800],
      900: zinc[900],
    },
  },
  shape: { borderRadius: 11 },
  typography: {
    h1: { fontWeight: 600, letterSpacing: '-0.03em' },
    h2: { fontWeight: 600, letterSpacing: '-0.025em' },
    h3: { fontWeight: 600, letterSpacing: '-0.02em' },
    h4: { fontWeight: 600, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, letterSpacing: '-0.015em' },
    h6: { fontWeight: 600, letterSpacing: '-0.01em' },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '-0.01em' },
    overline: {
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      lineHeight: 1.4,
    },
    // --- Shared text scale — replaces ad-hoc inline fontSize/weight ---
    statXl: { fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' },
    statLg: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' },
    cardTitle: { fontSize: 16, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.2 },
    panelTitle: { fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.25 },
    bodyStrong: { fontSize: 14, fontWeight: 600, letterSpacing: '-0.005em', lineHeight: 1.4 },
    body: { fontSize: 13, fontWeight: 500, lineHeight: 1.45 },
    label: { fontSize: 12, fontWeight: 500, lineHeight: 1.4 },
    note: { fontSize: 11, fontWeight: 500, lineHeight: 1.4 },
    micro: { fontSize: 10, fontWeight: 500, lineHeight: 1.4 },
  },
  components: {
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h5', h6: 'h6',
          subtitle1: 'h6', subtitle2: 'h6', body1: 'p', body2: 'p', inherit: 'p',
          statXl: 'div', statLg: 'div', cardTitle: 'div', panelTitle: 'div',
          bodyStrong: 'div', body: 'div', label: 'div', note: 'div', micro: 'div',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 8 } },
      variants: [
        {
          props: { variant: 'subtle' },
          style: {
            color: zinc[600],
            '&:hover': { backgroundColor: zinc[100] },
          },
        },
      ],
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiDialog: {
      defaultProps: {
        slotProps: { backdrop: { sx: { backgroundColor: 'rgba(16,24,32,0.42)' } } },
      },
      styleOverrides: {
        paper: { borderRadius: 20, maxWidth: '100%', boxShadow: brand.shadow.lg },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
        label: { letterSpacing: '-0.005em' },
      },
    },
  },
})
