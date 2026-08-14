'use client'

import { useEffect, useState } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import { AppDialog } from '@/components/ui'
import { memberLabel } from '@/lib/members'
import type { Member } from '@/components/MemberAvatar'

const JOINT = '__joint__'

interface LinkBankDialogProps {
  open: boolean
  onClose: () => void
  members: Member[]
  meId: string
  createLinkToken: () => Promise<string | null>
  onLinked: (input: { publicToken: string; institutionName: string; ownerId: string | null }) => Promise<boolean>
}

/**
 * Owner picker, then Plaid's hosted Link flow. One connection = one owner —
 * see the "per bank connection" attribution decision in the Plaid plan.
 */
export function LinkBankDialog({ open, onClose, members, meId, createLinkToken, onLinked }: LinkBankDialogProps) {
  const [owner, setOwner] = useState(meId)
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { open: openLink, ready } = usePlaidLink({
    token: linkToken ?? '',
    onSuccess: async (publicToken, metadata) => {
      // Typed nullable by the SDK, but Plaid always sends one alongside a real
      // onSuccess call — there's nothing useful to do without it.
      if (!publicToken) return
      const ok = await onLinked({
        publicToken,
        institutionName: metadata.institution?.name ?? 'Bank',
        ownerId: owner === JOINT ? null : owner,
      })
      setLinkToken(null)
      if (ok) onClose()
    },
    onExit: () => setLinkToken(null),
  })

  // Plaid Link isn't ready to `open()` the instant a token lands — fire once it is.
  useEffect(() => {
    if (linkToken && ready) openLink()
  }, [linkToken, ready, openLink])

  async function handleConnect() {
    setLoading(true)
    setError(null)
    const token = await createLinkToken()
    setLoading(false)
    if (!token) {
      setError('Could not start Plaid Link. Try again.')
      return
    }
    setLinkToken(token)
  }

  return (
    <AppDialog
      open={open}
      onClose={() => { setError(null); onClose() }}
      title="Link a bank"
      subtitle="Transactions from this account will import under the owner you pick here."
      width={420}
    >
      <Stack spacing={2} sx={{ p: '4px 22px 22px' }}>
        <TextField label="Belongs to" size="small" select value={owner} onChange={(e) => setOwner(e.target.value)}>
          {members.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {memberLabel(m)}
            </MenuItem>
          ))}
          <MenuItem value={JOINT}>Joint account</MenuItem>
        </TextField>
        {error && <Stack sx={{ fontSize: 13, color: 'error.main' }}>{error}</Stack>}
        <Button
          variant="contained"
          onClick={handleConnect}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
          sx={{ alignSelf: 'flex-start' }}
        >
          Continue to Plaid
        </Button>
      </Stack>
    </AppDialog>
  )
}
