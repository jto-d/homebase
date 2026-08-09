'use client'

import { useQuery } from '@urql/next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Link from 'next/link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { HouseholdProvider } from './household-context'
import { HouseholdDocument } from './household.queries'

/**
 * Persistent app chrome. Mounts once and stays mounted across route changes,
 * so the single household query runs once and is shared with every page via
 * context.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({ query: HouseholdDocument })

  if (fetching) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', height: '100vh', p: 3 }}>
        <Alert severity="error" variant="outlined">
          {error.message}
        </Alert>
      </Box>
    )
  }

  if (!data) return null

  const members = data.household.members
  const me = members.find((m) => m.id === data.me.id) ?? members[0]
  const partner = members.find((m) => m.id !== me.id) ?? null

  return (
    <HouseholdProvider
      value={{
        householdId: data.household.id,
        me,
        partner,
        members,
        refetch: () => reexecuteQuery({ requestPolicy: 'network-only' }),
      }}
    >
      <Stack sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 3,
            py: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: '#fff',
          }}
        >
          <Typography
            component={Link}
            href="/"
            variant="h6"
            sx={{ fontWeight: 700, color: 'primary.main', textDecoration: 'none' }}
          >
            Homebase
          </Typography>
          <Stack direction="row" spacing={2.5}>
            {[
              { href: '/budget', label: 'Budget' },
              { href: '/transactions', label: 'Transactions' },
              { href: '/settings', label: 'Settings' },
            ].map((link) => (
              <Typography
                key={link.href}
                component={Link}
                href={link.href}
                variant="body2"
                sx={{ color: 'text.secondary', textDecoration: 'none' }}
              >
                {link.label}
              </Typography>
            ))}
          </Stack>
        </Stack>
        <Box component="main" sx={{ flex: 1, p: 3 }}>
          {children}
        </Box>
      </Stack>
    </HouseholdProvider>
  )
}
