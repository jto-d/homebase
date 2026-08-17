'use client'

import { useQuery } from '@urql/next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Link from 'next/link'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { MemberAvatar } from '@/components/MemberAvatar'
import { HouseholdProvider } from './household-context'
import { Sidebar } from './sidebar'
import { HouseholdDocument } from './household.queries'

/**
 * Persistent app chrome. Stays mounted across route changes, so the household
 * query runs once and is shared with every page via context.
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
  const { budgetStartYear, budgetStartMonth } = data.household
  const budgetStart =
    budgetStartYear != null && budgetStartMonth != null
      ? { year: budgetStartYear, month: budgetStartMonth }
      : null

  return (
    <HouseholdProvider
      value={{
        householdId: data.household.id,
        me,
        partner,
        members,
        budgetStart,
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
            href="/budget"
            variant="h6"
            sx={{ fontWeight: 700, color: 'primary.main', textDecoration: 'none' }}
          >
            Homebase
          </Typography>
          {/* Navigation lives in the sidebar; the bar keeps identity only. */}
          <MemberAvatar member={me} size={28} />
        </Stack>
        <Stack direction="row" sx={{ flex: 1 }}>
          <Sidebar />
          <Box component="main" sx={{ flex: 1, minWidth: 0, p: 3 }}>
            {children}
          </Box>
        </Stack>
      </Stack>
    </HouseholdProvider>
  )
}
