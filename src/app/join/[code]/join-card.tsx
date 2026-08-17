'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { useMutation, useQuery } from '@urql/next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { stashInviteCode } from './actions'
import { AcceptHouseholdInviteDocument, HouseholdInvitePreviewDocument } from './join.queries'

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', bgcolor: 'background.default', p: 2 }}
    >
      <Card sx={{ p: 5, width: '100%', maxWidth: 420 }}>
        <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
            Homebase
          </Typography>
          {children}
        </Stack>
      </Card>
    </Box>
  )
}

export function JoinCard({ code }: { code: string }) {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [{ data, fetching, error }] = useQuery({
    query: HouseholdInvitePreviewDocument,
    variables: { code },
  })
  const [, acceptInvite] = useMutation(AcceptHouseholdInviteDocument)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  if (fetching || status === 'loading') {
    return (
      <Frame>
        <CircularProgress />
      </Frame>
    )
  }

  if (error || !data) {
    return (
      <Frame>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          This invite link isn&apos;t valid. Ask your partner to send a new one.
        </Typography>
      </Frame>
    )
  }

  const { inviterName, householdFull } = data.householdInvitePreview

  if (householdFull) {
    return (
      <Frame>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {inviterName}&apos;s household is already full. Homebase is built for two people.
        </Typography>
      </Frame>
    )
  }

  async function handleSignIn() {
    // Carry the code through OAuth so a new account is created into this household.
    await stashInviteCode(code)
    await signIn('google', { callbackUrl: `/join/${code}` })
  }

  async function handleJoin() {
    setJoining(true)
    setJoinError(null)
    const result = await acceptInvite({ code })
    if (result.error) {
      setJoinError(result.error.graphQLErrors[0]?.message ?? result.error.message)
      setJoining(false)
      return
    }
    // householdId just changed — refresh the JWT before navigating so the gated
    // layout and the shell agree on which household this is.
    await update()
    router.push('/budget')
  }

  return (
    <Frame>
      <Typography variant="body1">
        <strong>{inviterName}</strong> invited you to share their Homebase.
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        You&apos;ll both see the same cards, budgets, and subscriptions. This can&apos;t be undone.
      </Typography>

      {joinError && (
        <Alert severity="error" sx={{ width: '100%' }}>
          {joinError}
        </Alert>
      )}

      {session?.userId ? (
        <Button variant="contained" size="large" fullWidth onClick={handleJoin} disabled={joining}>
          Join {inviterName}
        </Button>
      ) : (
        <Button variant="contained" size="large" fullWidth onClick={handleSignIn}>
          Continue with Google
        </Button>
      )}
    </Frame>
  )
}
