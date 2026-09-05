'use client'

import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import AddIcon from '@mui/icons-material/AddOutlined'
import { MemberAvatar, type Member } from '@/components/MemberAvatar'
import { AppDialog, Row, Segmented, Stack } from '@/components/ui'
import { memberLabel } from '@/lib/members'
import type { PointsProgramKind } from '@/gql/graphql'

export const KIND_LABEL: Record<PointsProgramKind, string> = {
  TRANSFERABLE: 'Transferable',
  HOTEL: 'Hotel',
  AIRLINE: 'Airline',
}

const KIND_OPTIONS = (Object.keys(KIND_LABEL) as PointsProgramKind[]).map((value) => ({ value, label: KIND_LABEL[value] }))

interface AddProgramDialogProps {
  open: boolean
  members: Member[]
  meId: string
  onClose: () => void
  onAdd: (name: string, kind: PointsProgramKind, ownerId: string, balance: number) => Promise<void> | void
}

export function AddProgramDialog({ open, members, meId, onClose, onAdd }: AddProgramDialogProps) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<PointsProgramKind>('TRANSFERABLE')
  const [ownerId, setOwnerId] = useState(meId)
  const [balance, setBalance] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName('')
      setKind('TRANSFERABLE')
      setOwnerId(meId)
      setBalance('')
      setSubmitting(false)
    }
  }, [open, meId])

  const trimmed = name.trim()
  const balanceNum = balance === '' ? 0 : parseInt(balance, 10)
  const canSave = trimmed.length > 0 && !Number.isNaN(balanceNum) && balanceNum >= 0

  async function handleConfirm() {
    if (!canSave) return
    setSubmitting(true)
    try {
      await onAdd(trimmed, kind, ownerId, balanceNum)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppDialog open={open} onClose={onClose} title="Add a program" width={420}>
      <Stack gap={2} sx={{ p: '8px 22px 20px' }}>
        <TextField
          label="Name"
          value={name}
          placeholder="Chase Ultimate Rewards"
          onChange={(e) => setName(e.target.value)}
          fullWidth
          size="small"
          sx={{ mt: 2 }}
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <Box>
          <Box sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: '6px' }}>Type</Box>
          <Segmented value={kind} onChange={(v) => setKind(v as PointsProgramKind)} options={KIND_OPTIONS} />
        </Box>

        {members.length > 1 && (
          <Box>
            <Box sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary', mb: '6px' }}>Owner</Box>
            <Segmented
              value={ownerId}
              onChange={setOwnerId}
              options={members.map((m) => ({ value: m.id, label: memberLabel(m), icon: <MemberAvatar member={m} size={18} /> }))}
            />
          </Box>
        )}

        <TextField
          label="Starting balance"
          value={balance}
          placeholder="0"
          onChange={(e) => setBalance(e.target.value.replace(/\D/g, ''))}
          fullWidth
          size="small"
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { inputMode: 'numeric' } }}
        />
      </Stack>

      <Row justify="end" gap={1.25} sx={{ p: '0 22px 22px' }}>
        <Button variant="subtle" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={!canSave || submitting}
          onClick={handleConfirm}
          startIcon={submitting ? <CircularProgress size={15} color="inherit" /> : <AddIcon />}
        >
          Add program
        </Button>
      </Row>
    </AppDialog>
  )
}
