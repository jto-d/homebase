'use client'

import { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import CheckIcon from '@mui/icons-material/CheckOutlined'
import { AppDialog, Row, Stack } from '@/components/ui'
import { perkCoverage } from '@/lib/perk'
import { fmtMoney } from '@/lib/format'
import type { CreditCardsQuery } from '@/gql/graphql'

type Perk = CreditCardsQuery['creditCards'][number]['perks'][number]

interface LogCreditDialogProps {
  perk: Perk | null
  onClose: () => void
  onSave: (perkId: string, amount: number, date: string, description: string) => void
}

/**
 * Logs one credit against a perk's current cycle. Prefills the amount at what's
 * still available this year (capped at one period's worth), so a plain "Save"
 * covers the common case of using the whole thing.
 */
export function LogCreditDialog({ perk, onClose, onSave }: LogCreditDialogProps) {
  // Retain the last perk so the dialog content stays rendered through the close
  // (exit) transition, instead of flashing empty when `perk` becomes null.
  const [shown, setShown] = useState<Perk | null>(null)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [desc, setDesc] = useState('')
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (!perk) return
    setShown(perk)
    const cov = perkCoverage(perk, { basis: 'year' })
    const defaultAmt = cov.openEnded ? 0 : Math.min(perk.totalAmount, cov.remaining)
    setAmount(cov.openEnded ? '' : String(defaultAmt))
    setDate(new Date().toISOString().slice(0, 10))
    setDesc('')
    setTouched(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perk?.id])

  const cov = shown ? perkCoverage(shown, { basis: 'year' }) : null
  const isOpenEnded = cov?.openEnded ?? false
  const remaining = cov?.remaining ?? 0

  const amtNum = parseFloat(amount)
  const amtInvalid = touched && (Number.isNaN(amtNum) || amtNum <= 0)
  const dateInvalid = touched && !date

  return (
    <AppDialog
      open={!!perk}
      onClose={onClose}
      title={shown?.name ?? ''}
      subtitle={shown ? (isOpenEnded ? 'Log a visit' : `${fmtMoney(remaining)} still available this period`) : undefined}
      width={420}
    >
      {shown && (
        <>
          <Stack gap={2} sx={{ p: '8px 22px 20px' }}>
            <TextField
              label="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
              size="small"
              sx={{ mt: 2 }}
              error={amtInvalid}
              helperText={amtInvalid ? 'Enter a positive amount' : undefined}
              slotProps={{
                input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
                inputLabel: { shrink: true },
              }}
            />
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              fullWidth
              size="small"
              error={dateInvalid}
              helperText={dateInvalid ? 'Date is required' : undefined}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Description (optional)"
              value={desc}
              placeholder="e.g. Uber Eats"
              onChange={(e) => setDesc(e.target.value)}
              fullWidth
              size="small"
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>

          <Row justify="end" gap={1.25} sx={{ p: '0 22px 22px' }}>
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<CheckIcon />}
              onClick={() => {
                setTouched(true)
                const n = parseFloat(amount)
                if (Number.isNaN(n) || n <= 0 || !date) return
                onSave(shown.id, n, date, desc.trim())
              }}
            >
              Save credit
            </Button>
          </Row>
        </>
      )}
    </AppDialog>
  )
}
