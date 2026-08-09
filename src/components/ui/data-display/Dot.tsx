import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'

interface DotProps {
  size?: number
  /** Any CSS color or theme color token (e.g. `'primary.main'`). */
  color?: string
  /** Render a rounded square instead of a circle. */
  square?: boolean
  sx?: SxProps<Theme>
}

/** A small colored swatch — legend marker, status indicator. */
export function Dot({ size = 9, color = 'currentColor', square = false, sx }: DotProps) {
  return (
    <Box
      sx={[
        { width: size, height: size, borderRadius: square ? '3px' : '999px', bgcolor: color, flexShrink: 0 },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    />
  )
}
