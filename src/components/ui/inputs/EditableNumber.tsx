'use client'

import { useCallback, useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import EditIcon from '@mui/icons-material/EditOutlined'

interface EditableNumberProps {
  value: number
  onChange: (v: number) => void
  size?: number
  weight?: number
}

/**
 * Inline click-to-edit whole-number field. Same commit-on-blur/Enter,
 * cancel-on-Escape behaviour as `EditableMoney`, minus the `$` framing and cent
 * rounding — for counts like a points balance rather than money.
 */
export function EditableNumber({ value, onChange, size = 22, weight = 600 }: EditableNumberProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const commit = useCallback(() => {
    const cleaned = draft.replace(/[^0-9]/g, '')
    const n = cleaned === '' ? 0 : Math.max(0, Math.round(parseFloat(cleaned)))
    setEditing(false)
    if (!Number.isNaN(n) && n !== value) onChange(n)
  }, [draft, value, onChange])

  if (editing) {
    return (
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
              p: '0 0 2px',
              width: 130,
              borderBottom: '2px solid',
              borderColor: 'primary.main',
            },
          },
        }}
      />
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
        alignItems: 'flex-end',
        gap: '6px',
        border: 'none',
        p: 0,
        cursor: 'pointer',
        bgcolor: 'transparent',
        fontFamily: 'inherit',
        color: 'text.primary',
      }}
    >
      <Box component="span" sx={{ fontSize: size, fontWeight: weight, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
        {value.toLocaleString('en-US')}
      </Box>
      <EditIcon sx={{ fontSize: Math.round(size * 0.68), color: 'text.disabled', mb: '2px' }} />
    </Box>
  )
}
