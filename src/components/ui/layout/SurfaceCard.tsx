import Box from '@mui/material/Box'
import type { SxProps, Theme } from '@mui/material/styles'
import { brand } from '@/lib/theme'

/** White, softly-shadowed rounded panel — the base surface for cards and panels. */
export function SurfaceCard({ children, sx }: { children: React.ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Box
      sx={[
        {
          bgcolor: '#fff',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: '14px',
          boxShadow: brand.shadow.sm,
          overflow: 'hidden',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  )
}
