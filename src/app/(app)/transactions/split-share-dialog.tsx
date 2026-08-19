'use client'

import { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import Slider from '@mui/material/Slider'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { AppDialog, Row, Stack } from '@/components/ui'
import { MemberAvatar } from '@/components/MemberAvatar'
import type { Member } from '@/components/MemberAvatar'
import { fmtMoney } from '@/lib/format'
import { memberLabel } from '@/lib/members'

interface SplitShareDialogProps {
  open: boolean
  onClose: () => void
  merchant: string
  amount: number
  /** Who paid, and the other household member — always these two, regardless of who's viewing. */
  payer: Member
  counterparty: Member
  /** The counterparty's current share, or null if the transaction is undecided. */
  initialCounterpartyAmount: number | null
  onSubmit: (counterpartyAmount: number) => Promise<boolean>
  onUnsplit: () => Promise<boolean>
}

const buttonSx = { borderRadius: '8px', textTransform: 'none' as const, fontWeight: 600 }

/**
 * Any ratio the two one-click chips (50/50, all-on-payer) don't cover — a
 * percent slider from 0 to 100, where 100 is a straight reimbursement (the
 * whole thing is the counterparty's). Cents are derived from the percent so
 * the two shares always sum back to the exact total.
 */
export function SplitShareDialog({
  open,
  onClose,
  merchant,
  amount,
  payer,
  counterparty,
  initialCounterpartyAmount,
  onSubmit,
  onUnsplit,
}: SplitShareDialogProps) {
  const totalCents = Math.round(amount * 100)
  const initialPct =
    initialCounterpartyAmount == null ? 50 : Math.round((initialCounterpartyAmount * 100 * 100) / totalCents)
  const [pct, setPct] = useState(initialPct)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setPct(initialPct)
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const counterpartyCents = Math.round((totalCents * pct) / 100)
  const counterpartyShare = counterpartyCents / 100
  const payerShare = (totalCents - counterpartyCents) / 100

  async function handleSubmit() {
    const ok = await onSubmit(counterpartyShare)
    if (ok) onClose()
    else setError('Could not save that split')
  }

  async function handleUnsplit() {
    const ok = await onUnsplit()
    if (ok) onClose()
    else setError('Could not update that transaction')
  }

  return (
    <AppDialog open={open} onClose={onClose} title={`Split "${merchant}"`} subtitle={fmtMoney(amount)} width={420}>
      <Stack gap={2.5} sx={{ px: '22px', pb: '22px' }}>
        <Box sx={{ px: '6px' }}>
          <Slider
            value={pct}
            onChange={(_e, v) => setPct(v as number)}
            step={1}
            min={0}
            max={100}
            marks={[0, 25, 50, 75, 100].map((value) => ({ value }))}
            valueLabelDisplay="auto"
            valueLabelFormat={(v) => `${v}%`}
          />
        </Box>

        <Row justify="between" sx={{ px: '2px' }}>
          <Row gap={1}>
            <MemberAvatar member={counterparty} size={26} />
            <Stack gap={0}>
              <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
                {memberLabel(counterparty)}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                {fmtMoney(counterpartyShare)}
              </Typography>
            </Stack>
          </Row>
          <Row gap={1}>
            <Stack gap={0} sx={{ alignItems: 'flex-end' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.3 }}>
                {memberLabel(payer)}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                {fmtMoney(payerShare)}
              </Typography>
            </Stack>
            <MemberAvatar member={payer} size={26} />
          </Row>
        </Row>

        {error && <Typography sx={{ fontSize: 13, color: 'error.main' }}>{error}</Typography>}

        <Row justify="between">
          <Button size="small" onClick={handleUnsplit} sx={{ ...buttonSx, color: 'text.secondary' }}>
            Unsplit
          </Button>
          <Row gap={1}>
            <Button variant="outlined" size="small" onClick={onClose} sx={buttonSx}>
              Cancel
            </Button>
            <Button variant="contained" size="small" onClick={handleSubmit} sx={buttonSx}>
              Save
            </Button>
          </Row>
        </Row>
      </Stack>
    </AppDialog>
  )
}
