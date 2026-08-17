'use client'

import { useState } from 'react'
import { useMutation } from '@urql/next'
import { signOut } from 'next-auth/react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { MemberAvatar } from '@/components/MemberAvatar'
import { currentMonth, MonthStepper, type MonthSel } from '@/components/MonthStepper'
import { memberLabel } from '@/lib/members'
import { useHousehold } from '../household-context'
import { CreateHouseholdInviteDocument, SetBudgetStartDocument } from '../household.queries'

export default function SettingsPage() {
  const { me, partner, budgetStart, refetch } = useHousehold()
  const [{ fetching }, createInvite] = useMutation(CreateHouseholdInviteDocument)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [sel, setSel] = useState<MonthSel>(budgetStart ?? currentMonth())
  const [{ fetching: savingStart }, setBudgetStart] = useMutation(SetBudgetStartDocument)
  const [startError, setStartError] = useState<string | null>(null)
  const startDirty = budgetStart == null || sel.year !== budgetStart.year || sel.month !== budgetStart.month

  async function handleSaveStart() {
    setStartError(null)
    const result = await setBudgetStart(sel)
    if (result.error) {
      setStartError(result.error.graphQLErrors[0]?.message ?? result.error.message)
      return
    }
    refetch()
  }

  async function handleCreateInvite() {
    setError(null)
    const result = await createInvite({})
    if (result.error) {
      setError(result.error.graphQLErrors[0]?.message ?? result.error.message)
      return
    }
    setInviteUrl(result.data?.createHouseholdInvite.url ?? null)
    setCopied(false)
  }

  async function handleCopy() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
  }

  return (
    <Stack spacing={3} sx={{ maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Settings
      </Typography>

      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Household
          </Typography>

          <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
            <MemberAvatar member={me} />
            <Typography variant="body2">{memberLabel(me)} (you)</Typography>
          </Stack>

          {partner ? (
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <MemberAvatar member={partner} />
              <Stack>
                <Typography variant="body2">{memberLabel(partner)}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {partner.email}
                </Typography>
              </Stack>
            </Stack>
          ) : (
            <>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Send your partner a link to join. It works once and never expires.
              </Typography>

              {error && <Alert severity="error">{error}</Alert>}

              {inviteUrl ? (
                <Stack spacing={1}>
                  <TextField
                    value={inviteUrl}
                    size="small"
                    fullWidth
                    slotProps={{ htmlInput: { readOnly: true } }}
                  />
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={handleCopy}>
                      {copied ? 'Copied' : 'Copy link'}
                    </Button>
                    <Button onClick={handleCreateInvite} disabled={fetching}>
                      New link
                    </Button>
                  </Stack>
                </Stack>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleCreateInvite}
                  disabled={fetching}
                  sx={{ alignSelf: 'flex-start' }}
                >
                  Create invite link
                </Button>
              )}
            </>
          )}
        </Stack>
      </Card>

      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Budget
          </Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            The month your budget begins. Earlier months are hidden from the stepper, for both of
            you.
          </Typography>

          {startError && <Alert severity="error">{startError}</Alert>}

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
            <MonthStepper value={sel} onChange={setSel} />
            <Button variant="contained" onClick={handleSaveStart} disabled={!startDirty || savingStart}>
              Save
            </Button>
          </Stack>
        </Stack>
      </Card>

      <Card sx={{ p: 3 }}>
        <Button color="inherit" onClick={() => signOut({ callbackUrl: '/login' })}>
          Sign out
        </Button>
      </Card>
    </Stack>
  )
}
