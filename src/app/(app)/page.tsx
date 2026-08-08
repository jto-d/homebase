'use client'

import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import { MemberAvatar } from '@/components/MemberAvatar'
import { memberLabel } from '@/lib/members'
import { useHousehold } from './household-context'

export default function HomePage() {
  const { me, partner, members } = useHousehold()

  return (
    <Stack spacing={3} sx={{ maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Your household
      </Typography>

      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          {members.map((member) => (
            <Stack key={member.id} direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <MemberAvatar member={member} />
              <Stack>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {memberLabel(member)}
                  {member.id === me.id && (
                    <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
                      {' '}
                      (you)
                    </Typography>
                  )}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {member.email}
                </Typography>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Card>

      {!partner && (
        <Card sx={{ p: 3 }}>
          <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              You&apos;re the only one here. Invite your partner to share everything in Homebase.
            </Typography>
            <Button component={Link} href="/settings" variant="contained">
              Invite your partner
            </Button>
          </Stack>
        </Card>
      )}
    </Stack>
  )
}
