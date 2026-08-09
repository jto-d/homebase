'use client'

import { useCallback, useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { brand } from '@/lib/theme'
import { fmtDollars } from '@/lib/format'
import { roundCents } from '@/lib/budget'

interface EditableMoneyProps {
  value: number
  onChange: (v: number) => void
  /** Render `0` as an em dash instead of `$0`. */
  muted?: boolean
  color?: string
  size?: number
  weight?: number
}

/**
 * Inline click-to-edit dollar field. Commits on blur/Enter, cancels on Escape.
 *
 * Clamps at zero, but that is a convenience, not the rule — the resolvers reject
 * negatives too, because the API is not the UI.
 */
export function EditableMoney({ value, onChange, muted, color, size = 14, weight = 500 }: EditableMoneyProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const commit = useCallback(() => {
    const cleaned = draft.replace(/[^0-9.]/g, '')
    const n = cleaned === '' ? 0 : Math.max(0, roundCents(parseFloat(cleaned)))
    setEditing(false)
    if (!Number.isNaN(n) && n !== value) onChange(n)
  }, [draft, value, onChange])

  if (editing) {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          height: 28,
          border: '1px solid',
          borderColor: 'primary.main',
          borderRadius: '7px',
          px: 1,
          bgcolor: '#fff',
          boxShadow: `0 0 0 2px ${brand.accentSoft}`,
        }}
      >
        <Typography sx={{ color: 'text.disabled', fontSize: size, fontWeight: weight }}>$</Typography>
        <TextField
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            else if (e.key === 'Escape') setEditing(false)
          }}
          variant="standard"
          autoFocus
          slotProps={{
            input: {
              disableUnderline: true,
              sx: {
                fontSize: size,
                fontWeight: weight,
                fontVariantNumeric: 'tabular-nums',
                p: 0,
                width: 74,
                textAlign: 'right',
              },
            },
          }}
          sx={{ ml: '2px' }}
        />
      </Box>
    )
  }

  return (
    <Box
      component="button"
      onClick={() => {
        setDraft(value ? String(value) : '')
        setEditing(true)
      }}
      title="Click to edit"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 28,
        minWidth: 64,
        px: 1,
        cursor: 'text',
        border: '1px solid transparent',
        borderRadius: '7px',
        bgcolor: 'transparent',
        fontFamily: 'inherit',
        fontVariantNumeric: 'tabular-nums',
        fontSize: size,
        fontWeight: weight,
        color: color || (muted && value === 0 ? 'text.disabled' : 'text.primary'),
        '&:hover': { bgcolor: 'grey.50', borderColor: 'divider' },
        transition: 'background 0.15s ease',
      }}
    >
      {value === 0 && muted ? '—' : fmtDollars(value)}
    </Box>
  )
}
