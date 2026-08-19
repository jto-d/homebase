'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@urql/next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Collapse from '@mui/material/Collapse'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/AddOutlined'
import RefreshIcon from '@mui/icons-material/RefreshOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreOutlined'
import { MemberAvatar, type Member } from '@/components/MemberAvatar'
import { LinkBankDialog } from '@/components/LinkBankDialog'
import { CatGlyph, Eyebrow, ListRow, Row, Stack, Stat, SurfaceCard } from '@/components/ui'
import { fmtDollars, fmtMoney } from '@/lib/format'
import { tabularNums, truncate } from '@/lib/sx'
import { useHousehold } from '../household-context'
import { AccountsDocument, CreateInvestmentLinkTokenDocument, LinkInvestmentAccountDocument } from './accounts.queries'
import type { AccountsQuery } from '@/gql/graphql'

type Account = AccountsQuery['accounts'][number]

type MutationResult = { error?: { graphQLErrors: readonly { message: string }[]; message: string } }

export default function AccountsPage() {
  const { me, members } = useHousehold()
  const [error, setError] = useState<string | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [closed, setClosed] = useState<Record<string, boolean>>({})

  const [{ data, fetching }, refetch] = useQuery({ query: AccountsDocument })
  const [, createLinkToken] = useMutation(CreateInvestmentLinkTokenDocument)
  const [, linkAccount] = useMutation(LinkInvestmentAccountDocument)

  function reload() {
    refetch({ requestPolicy: 'network-only' })
  }

  function report(result: MutationResult): boolean {
    if (result.error) {
      setError(result.error.graphQLErrors[0]?.message ?? result.error.message)
      return false
    }
    setError(null)
    return true
  }

  const accounts = data?.accounts ?? []
  const cash = accounts.filter((a) => a.kind === 'cash')
  const investments = accounts.filter((a) => a.kind === 'investment')
  const total = accounts.reduce((sum, a) => sum + a.balance, 0)

  function subLine(a: Account): string {
    const parts = [a.institutionName, a.subtype ? capitalize(a.subtype) : null, a.mask ? `••${a.mask}` : null]
    return parts.filter(Boolean).join(' · ')
  }

  function ownerFor(a: Account) {
    return a.ownerId ? members.find((m) => m.id === a.ownerId) : null
  }

  function renderGroup(label: string, icon: string, tone: 'neutral' | 'accent', items: Account[]) {
    if (items.length === 0) return null
    const groupTotal = items.reduce((sum, a) => sum + a.balance, 0)
    const collapsed = !!closed[label]
    return (
      <Box key={label}>
        <Stack
          direction="row"
          align="center"
          gap={1.25}
          onClick={() => setClosed((p) => ({ ...p, [label]: !p[label] }))}
          sx={{ px: 2.5, py: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { bgcolor: 'grey.100' } }}
        >
          <ExpandMoreIcon
            sx={{ fontSize: 16, color: 'text.secondary', transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.18s ease' }}
          />
          <CatGlyph icon={icon} tone={tone} size={26} />
          <Eyebrow sx={{ flex: 1 }}>
            {label} <Box component="span" sx={{ color: 'text.disabled', fontWeight: 600 }}>{items.length}</Box>
          </Eyebrow>
          <Typography variant="body2" sx={{ fontWeight: 600, ...tabularNums }}>
            {fmtDollars(groupTotal)}
          </Typography>
        </Stack>
        <Collapse in={!collapsed}>
          {items.map((a, i) => (
            <AccountRow
              key={a.id}
              account={a}
              owner={ownerFor(a)}
              subLine={subLine(a)}
              last={i === items.length - 1}
              expanded={!!expanded[a.id]}
              onToggle={() => setExpanded((p) => ({ ...p, [a.id]: !p[a.id] }))}
            />
          ))}
        </Collapse>
      </Box>
    )
  }

  return (
    <Stack gap={3} sx={{ maxWidth: 820, mx: 'auto' }}>
      <Row justify="between" align="end">
        <Stat hero label="Total" value={fmtDollars(total)} />
        <Row gap={1.5}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={reload}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setLinkOpen(true)}>
            Link account
          </Button>
        </Row>
      </Row>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {fetching && !data ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : accounts.length === 0 ? (
        <Stack align="center" gap={1.5} sx={{ py: 8, textAlign: 'center' }}>
          <Typography sx={{ color: 'text.secondary' }}>No accounts linked yet.</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setLinkOpen(true)}>
            Link account
          </Button>
        </Stack>
      ) : (
        <SurfaceCard>
          {renderGroup('Cash', 'wallet', 'neutral', cash)}
          {renderGroup('Investments', 'trendingUp', 'accent', investments)}
          <Row justify="between" align="center" sx={{ px: 2.5, py: 1.75, bgcolor: 'grey.50', borderTop: '1px solid', borderColor: 'divider' }}>
            <Eyebrow>Total assets</Eyebrow>
            <Typography sx={{ fontWeight: 700, ...tabularNums }}>{fmtDollars(total)}</Typography>
          </Row>
        </SurfaceCard>
      )}

      <LinkBankDialog
        open={linkOpen}
        onClose={() => setLinkOpen(false)}
        members={members}
        meId={me.id}
        title="Link an account"
        subtitle="Savings and investment balances refresh live — nothing is imported."
        createLinkToken={async () => {
          const result = await createLinkToken({})
          return report(result) ? result.data!.createPlaidLinkToken : null
        }}
        onLinked={async ({ publicToken, institutionName, ownerId }) => {
          const ok = report(await linkAccount({ publicToken, institutionName, ownerId }))
          if (ok) reload()
          return ok
        }}
      />
    </Stack>
  )
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function AccountRow({
  account,
  owner,
  subLine,
  last,
  expanded,
  onToggle,
}: {
  account: Account
  owner: Member | null | undefined
  subLine: string
  last: boolean
  expanded: boolean
  onToggle: () => void
}) {
  const isInvestment = account.kind === 'investment'
  return (
    <Box>
      <ListRow gap={1.5} last={last && !expanded} hover={isInvestment} onClick={isInvestment ? onToggle : undefined}>
        {owner ? <MemberAvatar member={owner} size={32} /> : <CatGlyph icon="wallet" tone="neutral" size={32} />}
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600, ...truncate }}>
            {account.name}
          </Typography>
          <Typography variant="caption" noWrap sx={{ color: 'text.secondary', ...truncate }}>
            {subLine}
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ fontWeight: 600, ...tabularNums }}>
          {isInvestment ? fmtDollars(account.balance) : fmtMoney(account.balance)}
        </Typography>
        {isInvestment && (
          <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary', transform: expanded ? 'none' : 'rotate(-90deg)', transition: 'transform 0.18s ease' }} />
        )}
      </ListRow>
      {isInvestment && (
        <Collapse in={expanded}>
          <Box sx={{ px: 2.5, pb: 2, pl: '68px', bgcolor: 'grey.50', borderBottom: last ? 'none' : '1px solid', borderColor: 'divider' }}>
            {account.holdings.length === 0 ? (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', pt: 1.5 }}>
                Holdings aren&rsquo;t available for this account — tracked by balance only.
              </Typography>
            ) : (
              account.holdings.map((h, i) => (
                <Row key={i} justify="between" gap={1.5} sx={{ py: 1, borderBottom: i === account.holdings.length - 1 ? 'none' : '1px solid', borderColor: 'divider' }}>
                  <Row gap={1} sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, ...tabularNums }}>
                      {h.ticker}
                    </Typography>
                    <Typography variant="caption" noWrap sx={{ color: 'text.secondary', ...truncate }}>
                      {h.name}
                    </Typography>
                  </Row>
                  {h.detail && (
                    <Typography variant="caption" sx={{ color: 'text.secondary', flex: 'none', ...tabularNums }}>
                      {h.detail}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ width: 90, textAlign: 'right', fontWeight: 600, flex: 'none', ...tabularNums }}>
                    {fmtDollars(h.value)}
                  </Typography>
                </Row>
              ))
            )}
          </Box>
        </Collapse>
      )}
    </Box>
  )
}
