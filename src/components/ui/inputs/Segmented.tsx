'use client'

import Box from '@mui/material/Box'
import { brand } from '@/lib/theme'

export interface SegmentedOption {
  value: string
  label: string
  /** Rendered before the label — a `MemberAvatar`, an icon, anything. */
  icon?: React.ReactNode
}

interface SegmentedProps {
  value: string
  onChange: (v: string) => void
  options: SegmentedOption[]
  size?: 'sm' | 'md'
}

/** Pill toggle. One option is always selected; there is no empty state. */
export function Segmented({ value, onChange, options, size = 'md' }: SegmentedProps) {
  const innerH = (size === 'sm' ? 32 : 36) - 8

  return (
    <Box
      sx={{
        display: 'inline-flex',
        p: '3px',
        gap: '2px',
        background: brand.zinc[100],
        borderRadius: '9px',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <Box
            key={o.value}
            component="button"
            onClick={() => onChange(o.value)}
            title={o.label}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              height: innerH,
              px: '12px',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '7px',
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '-0.005em',
              background: active ? '#fff' : 'transparent',
              color: active ? brand.zinc[950] : brand.zinc[500],
              boxShadow: active ? '0 1px 2px rgba(16,24,32,.05)' : 'none',
              transition: 'background 180ms ease, color 180ms ease',
            }}
          >
            {o.icon}
            {o.label}
          </Box>
        )
      })}
    </Box>
  )
}
