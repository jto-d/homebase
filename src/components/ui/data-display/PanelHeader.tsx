import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { SxProps, Theme } from '@mui/material/styles'
import { Row } from '../layout/Flex'
import { CatGlyph } from './CatGlyph'

interface PanelHeaderProps {
  /** CatGlyph icon slug. Omit to render no glyph. */
  icon?: string
  tone?: 'neutral' | 'accent' | 'amber' | 'red'
  iconSize?: number
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** Trailing content, right-aligned (e.g. a total, an icon button). */
  action?: React.ReactNode
  sx?: SxProps<Theme>
}

/** The standard card/panel header: glyph + title/subtitle on the left, optional action on the right. */
export function PanelHeader({ icon, tone = 'accent', iconSize = 30, title, subtitle, action, sx }: PanelHeaderProps) {
  return (
    <Row
      justify="between"
      gap={1.25}
      sx={[
        { px: 2.25, py: 2, borderBottom: '1px solid', borderColor: 'divider' },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Row gap={1.25} min0>
        {icon && <CatGlyph icon={icon} tone={tone} size={iconSize} />}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="panelTitle">{title}</Typography>
          {subtitle && (
            <Typography variant="label" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </Row>
      {action}
    </Row>
  )
}
