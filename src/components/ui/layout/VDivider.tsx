import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'

/** A 1px vertical rule that stretches to its flex parent's height. */
export function VDivider({ sx }: { sx?: SxProps<Theme> }) {
  return (
    <Box
      sx={[
        { width: '1px', alignSelf: 'stretch', bgcolor: 'divider' },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    />
  )
}
