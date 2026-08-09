import type { SxProps, Theme } from '@mui/material/styles'

export const truncate = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} satisfies SxProps<Theme>

export const tabularNums = {
  fontVariantNumeric: 'tabular-nums',
} satisfies SxProps<Theme>
