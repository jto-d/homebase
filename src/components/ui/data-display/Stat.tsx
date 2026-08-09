import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { SxProps, Theme } from '@mui/material/styles'
import { Eyebrow } from './Eyebrow'

interface StatProps {
  label: React.ReactNode
  value: React.ReactNode
  sub?: React.ReactNode
  /** Use the larger headline size for the value. */
  hero?: boolean
  /** Color applied to the label and value. */
  color?: string
  /** Color applied to the value only — use when the label should stay neutral. Wins over `color`. */
  valueColor?: string
  align?: 'left' | 'right'
  sx?: SxProps<Theme>
}

/** An eyebrow label over a (tabular) numeric value with an optional sub-line. */
export function Stat({ label, value, sub, hero = false, color, valueColor, align = 'left', sx }: StatProps) {
  return (
    <Box sx={[{ minWidth: 0, textAlign: align }, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
      <Eyebrow sx={{ fontSize: '10.5px', mb: '6px', color: color ?? 'text.secondary' }}>{label}</Eyebrow>
      <Typography variant={hero ? 'statXl' : 'statLg'} sx={{ color: valueColor ?? color ?? 'text.primary' }}>
        {value}
      </Typography>
      {sub && (
        <Typography variant="label" color="text.secondary" sx={{ mt: '6px' }}>
          {sub}
        </Typography>
      )}
    </Box>
  )
}
