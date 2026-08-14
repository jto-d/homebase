'use client'

import { useState } from 'react'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { AppDialog } from '@/components/ui'
import { memberLabel } from '@/lib/members'
import type { Member } from '@/components/MemberAvatar'

const JOINT = '__joint__'

interface AddTransactionDialogProps {
  open: boolean
  onClose: () => void
  members: Member[]
  meId: string
  onSubmit: (input: { merchant: string; date: string; amount: number; ownerId: string | null }) => Promise<boolean>
}

/**
 * Merchant / date / amount / payer only — no category or split here. Every new
 * transaction lands unfiled in the inbox; filing happens from the row.
 */
export function AddTransactionDialog({ open, onClose, members, meId, onSubmit }: AddTransactionDialogProps) {
  const [merchant, setMerchant] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [amount, setAmount] = useState('')
  const [payer, setPayer] = useState(meId)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setMerchant('')
    setAmount('')
    setError(null)
  }

  async function handleSubmit() {
    const value = Number(amount)
    if (!merchant.trim() || !Number.isFinite(value) || value <= 0) {
      setError('Enter a merchant and an amount')
      return
    }
    const ok = await onSubmit({ merchant, date, amount: value, ownerId: payer === JOINT ? null : payer })
    if (ok) {
      reset()
      onClose()
    }
  }

  return (
    <AppDialog open={open} onClose={() => { reset(); onClose() }} title="Add a transaction" width={420}>
      <Stack spacing={2} sx={{ p: '4px 22px 22px' }}>
        <TextField
          label="Merchant"
          size="small"
          autoFocus
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
        />
        <Stack direction="row" spacing={1.5}>
          <TextField
            label="Date"
            type="date"
            size="small"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Amount"
            size="small"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            sx={{ width: 120 }}
          />
        </Stack>
        <TextField label="Paid by" size="small" select value={payer} onChange={(e) => setPayer(e.target.value)}>
          {members.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {memberLabel(m)}
            </MenuItem>
          ))}
          <MenuItem value={JOINT}>Joint account</MenuItem>
        </TextField>
        {error && (
          <Stack sx={{ fontSize: 13, color: 'error.main' }}>{error}</Stack>
        )}
        <Button variant="contained" onClick={handleSubmit} sx={{ alignSelf: 'flex-start' }}>
          Add transaction
        </Button>
      </Stack>
    </AppDialog>
  )
}
