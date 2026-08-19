'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@urql/next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/AddOutlined'
import { MemberAvatar } from '@/components/MemberAvatar'
import { Dot, ProgressBar, Row, Segmented, Stack, Stat, SurfaceCard } from '@/components/ui'
import { fmtDollars } from '@/lib/format'
import { memberLabel } from '@/lib/members'
import { perkCoverage, perkStatus } from '@/lib/perk'
import { useHousehold } from '../household-context'
import { AddCardDocument, CreditCardsDocument, LogPerkCreditDocument, RemoveCardDocument } from './cards.queries'
import { PerkTracker } from './perk-tracker'
import { CategoryGuide } from './category-guide'
import { CardList } from './card-list'
import { AddCardDialog } from './add-card-dialog'
import { RemoveCardDialog, type PendingRemove } from './remove-card-dialog'
import { LogCreditDialog } from './log-credit-dialog'
import type { CreditCardsQuery } from '@/gql/graphql'

type Card = CreditCardsQuery['creditCards'][number]
type Perk = Card['perks'][number]

type MutationResult = { error?: { graphQLErrors: readonly { message: string }[]; message: string } }

const HOUSEHOLD = 'household'

function unusedPerks(cards: Card[]): number {
  const now = new Date()
  return cards.reduce(
    (sum, c) => sum + c.perks.reduce((s, p) => s + perkCoverage(p, { basis: 'cycle', cardOpenedDate: c.openedDate, now }).remaining, 0),
    0
  )
}

function annualFees(cards: Card[]): number {
  return cards.reduce((sum, c) => sum + c.annualFee, 0)
}

function urgentCount(cards: Card[]): number {
  const now = new Date()
  let count = 0
  for (const c of cards) {
    for (const p of c.perks) {
      const status = perkStatus(p, c.openedDate, now)
      if (status.key === 'expiring') count++
    }
  }
  return count
}

export default function CardsPage() {
  const { me, partner, members } = useHousehold()
  const [view, setView] = useState<string>(HOUSEHOLD)
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<PendingRemove | null>(null)
  const [logging, setLogging] = useState<Perk | null>(null)

  const [{ data, fetching }, refetch] = useQuery({ query: CreditCardsDocument })
  const [, addCard] = useMutation(AddCardDocument)
  const [, removeCard] = useMutation(RemoveCardDocument)
  const [, logPerkCredit] = useMutation(LogPerkCreditDocument)

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

  const allCards = data?.creditCards ?? []
  const cards = view === HOUSEHOLD ? allCards : allCards.filter((c) => c.ownerId === view)

  return (
    <Stack gap={3} sx={{ maxWidth: 900, mx: 'auto' }}>
      <Row justify="between" align="end" wrap gap={2}>
        <Typography variant="h5">Cards</Typography>
        <Row gap={1.5}>
          {partner && (
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: HOUSEHOLD, label: 'Household' },
                { value: me.id, label: memberLabel(me), icon: <MemberAvatar member={me} size={18} /> },
                { value: partner.id, label: memberLabel(partner), icon: <MemberAvatar member={partner} size={18} /> },
              ]}
            />
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>
            Add card
          </Button>
        </Row>
      </Row>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {fetching && !data ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Summary view={view} cards={allCards} members={members} me={me} partner={partner} />
          <PerkTracker cards={cards} members={members} onLog={(perk) => setLogging(perk)} />
          <CategoryGuide cards={cards} members={members} />
          <CardList cards={cards} members={members} />
        </>
      )}

      <AddCardDialog
        open={addOpen}
        cards={allCards}
        members={members}
        meId={me.id}
        onClose={() => setAddOpen(false)}
        onAdd={async (catalogKey, ownerId, lastFour, openedDate) => {
          const ok = report(await addCard({ catalogKey, ownerId, lastFour: lastFour || undefined, openedDate: openedDate || undefined }))
          if (ok) {
            reload()
            setAddOpen(false)
          }
        }}
      />

      <RemoveCardDialog
        card={pendingRemove}
        onClose={() => setPendingRemove(null)}
        onConfirm={async () => {
          if (!pendingRemove) return
          const ok = report(await removeCard({ cardId: pendingRemove.id }))
          setPendingRemove(null)
          if (ok) reload()
        }}
      />

      <LogCreditDialog
        perk={logging}
        onClose={() => setLogging(null)}
        onSave={async (perkId, amount, date, description) => {
          const ok = report(await logPerkCredit({ perkId, amount, date, description: description || undefined }))
          setLogging(null)
          if (ok) reload()
        }}
      />
    </Stack>
  )
}

function Summary({
  view,
  cards,
  members,
  me,
  partner,
}: {
  view: string
  cards: Card[]
  members: ReturnType<typeof useHousehold>['members']
  me: ReturnType<typeof useHousehold>['me']
  partner: ReturnType<typeof useHousehold>['partner']
}) {
  const urgent = urgentCount(view === HOUSEHOLD ? cards : cards.filter((c) => c.ownerId === view))

  if (view !== HOUSEHOLD) {
    const owner = members.find((m) => m.id === view)
    const ownerCards = cards.filter((c) => c.ownerId === view)
    if (!owner) return null
    return (
      <SurfaceCard>
        <Row gap={2.5} sx={{ p: '22px 26px' }}>
          <MemberAvatar member={owner} size={52} />
          <Row gap={5.5} sx={{ flex: 1 }}>
            <Stat hero label="Unused perks" value={fmtDollars(unusedPerks(ownerCards))} />
            <Stat label="Annual fees / yr" value={fmtDollars(annualFees(ownerCards))} />
          </Row>
        </Row>
      </SurfaceCard>
    )
  }

  if (!partner) {
    return (
      <SurfaceCard>
        <Row gap={5.5} sx={{ p: '22px 26px' }}>
          <Stat hero label="Unused perks" value={fmtDollars(unusedPerks(cards))} />
          <Stat label="Annual fees / yr" value={fmtDollars(annualFees(cards))} />
        </Row>
      </SurfaceCard>
    )
  }

  const meCards = cards.filter((c) => c.ownerId === me.id)
  const partnerCards = cards.filter((c) => c.ownerId === partner.id)
  const meUnused = unusedPerks(meCards)
  const partnerUnused = unusedPerks(partnerCards)
  const total = meUnused + partnerUnused
  const meColor = `${me.color === 'teal' ? 'primary.main' : 'warning.main'}`
  const partnerColor = `${partner.color === 'teal' ? 'primary.main' : 'warning.main'}`

  return (
    <SurfaceCard>
      <Row align="stretch" sx={{ p: '22px 12px' }}>
        <Stat sx={{ flex: 1.15, px: 2.5 }} label="Unused perks" value={fmtDollars(total)} sub="across both wallets" />
        <Box sx={{ width: '1px', bgcolor: 'divider', my: '6px' }} />
        <Stat sx={{ flex: 1, px: 2.5 }} label={memberLabel(me)} value={fmtDollars(meUnused)} valueColor={meColor} sub={`unused · ${fmtDollars(annualFees(meCards))} fees`} />
        <Box sx={{ width: '1px', bgcolor: 'divider', my: '6px' }} />
        <Stat sx={{ flex: 1, px: 2.5 }} label={memberLabel(partner)} value={fmtDollars(partnerUnused)} valueColor={partnerColor} sub={`unused · ${fmtDollars(annualFees(partnerCards))} fees`} />
        <Box sx={{ width: '1px', bgcolor: 'divider', my: '6px' }} />
        <Stat sx={{ flex: 1, px: 2.5 }} label="Annual fees" value={fmtDollars(annualFees(cards))} sub="combined / yr" />
      </Row>
      <Box sx={{ px: 4, pb: '22px' }}>
        <Row sx={{ height: 8, borderRadius: 999, overflow: 'hidden', bgcolor: 'grey.100' }}>
          <Box sx={{ width: total > 0 ? `${(meUnused / total) * 100}%` : '50%', bgcolor: meColor }} />
          <Box sx={{ width: total > 0 ? `${(partnerUnused / total) * 100}%` : '50%', bgcolor: partnerColor }} />
        </Row>
        <Row justify="between" align="center" sx={{ mt: 1.5 }}>
          <Row gap={2.25}>
            <Row gap={0.75}>
              <Dot size={9} color={meColor} />
              <Typography variant="label" sx={{ color: 'text.secondary' }}>
                {memberLabel(me)}&rsquo;s perks
              </Typography>
            </Row>
            <Row gap={0.75}>
              <Dot size={9} color={partnerColor} />
              <Typography variant="label" sx={{ color: 'text.secondary' }}>
                {memberLabel(partner)}&rsquo;s perks
              </Typography>
            </Row>
          </Row>
          {urgent > 0 && (
            <Typography variant="micro" sx={{ color: 'error.main', bgcolor: 'error.light', borderRadius: 999, px: 1.25, py: '4px', fontWeight: 600 }}>
              {urgent} {urgent === 1 ? 'perk' : 'perks'} expiring soon
            </Typography>
          )}
        </Row>
      </Box>
    </SurfaceCard>
  )
}
