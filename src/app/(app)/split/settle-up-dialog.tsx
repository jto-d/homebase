'use client'

import { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { AppDialog } from '@/components/ui'
import { memberLabel } from '@/lib/members'
import type { Member } from '@/components/MemberAvatar'

interface SettleUpDialogProps {
  open: boolean
  onClose: () => void
  /** Who currently owes whom, and how much — the dialog's starting point. */
  debtor: Member
  creditor: Member
  amountOwed: number
  onSubmit: (input: {
    fromUserId: string
    toUserId: string
    amount: number
    date: string
    note: string | null
  }) => Promise<boolean>
}

/**
 * Prefilled with the current balance and today's date — the common case is one
 * click. Amount stays editable for a partial payback, and direction flippable
 * for the (rare) case the wrong person is prefilled as debtor.
 */
export function SettleUpDialog({ open, onClose, debtor, creditor, amountOwed, onSubmit }: SettleUpDialogProps) {
  const [fromUserId, setFromUserId] = useState(debtor.id)
  const [amount, setAmount] = useState(String(amountOwed))
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Re-seed whenever the dialog opens on a fresh balance — otherwise a second
  // "Settle up" click after the first settlement still shows the old amount.
  useEffect(() => {
    if (open) {
      setFromUserId(debtor.id)
      setAmount(String(amountOwed))
      setDate(new Date().toISOString().slice(0, 10))
      setNote('')
      setError(null)
    }
  }, [open, debtor.id, amountOwed])

  const toUserId = fromUserId === debtor.id ? creditor.id : debtor.id

  async function handleSubmit() {
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter an amount more than $0')
      return
    }
    const ok = await onSubmit({ fromUserId, toUserId, amount: value, date, note: note.trim() || null })
    if (ok) onClose()
  }

  return (
    <AppDialog open={open} onClose={onClose} title="Settle up" width={420}>
      <Stack spacing={2} sx={{ p: '4px 22px 22px' }}>
        <TextField label="Who paid" size="small" select value={fromUserId} onChange={(e) => setFromUserId(e.target.value)}>
          <MenuItem value={debtor.id}>{memberLabel(debtor)}</MenuItem>
          <MenuItem value={creditor.id}>{memberLabel(creditor)}</MenuItem>
        </TextField>
        <Stack direction="row" spacing={1.5}>
          <TextField
            label="Amount"
            size="small"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            slotProps={{ htmlInput: { inputMode: 'decimal' } }}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Date"
            type="date"
            size="small"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: 1 }}
          />
        </Stack>
        <TextField
          label="Note"
          size="small"
          placeholder="Venmo, cash, …"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {error && <Stack sx={{ fontSize: 13, color: 'error.main' }}>{error}</Stack>}
        <Button variant="contained" onClick={handleSubmit} sx={{ alignSelf: 'flex-start' }}>
          Record payment
        </Button>
      </Stack>
    </AppDialog>
  )
}
