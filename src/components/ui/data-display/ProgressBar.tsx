'use client'

import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'
import { clamp01 } from '@/lib/format'

/** A pill-shaped track + fill bar. `value` is a 0–1 fraction (clamped). `thin` selects the slim height. */
export function ProgressBar({
  value,
  color = 'primary.main',
  track = 'grey.100',
  thin = false,
  sx,
}: {
  value: number
  color?: string
  track?: string
  thin?: boolean
  sx?: SxProps<Theme>
}) {
  return (
    <Box
      sx={[
        { width: '100%', height: thin ? 5 : 8, borderRadius: 999, bgcolor: track, overflow: 'hidden' },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box
        sx={{
          height: '100%',
          width: `${clamp01(value) * 100}%`,
          bgcolor: color,
          borderRadius: 999,
          transition: 'width 0.3s ease',
        }}
      />
    </Box>
  )
}
