'use client'

import { use, useState } from 'react'
import { useMutation, useQuery } from '@urql/next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeftOutlined'
import Link from 'next/link'
import { MemberAvatar } from '@/components/MemberAvatar'
import { PanelHeader, Row, Stack, Stat, StatusChip, SurfaceCard } from '@/components/ui'
import { fmtDollars, fmtMoney } from '@/lib/format'
import { memberLabel } from '@/lib/members'
import { tabularNums } from '@/lib/sx'
import { resolveCardDesign, topRewards, fmtRate, baseReward, dbCardToRewardCard } from '@/lib/cardRewards'
import { cardAnnualFee, cardCapturedYTD, cardPerksUsed, cardVerdict } from '@/lib/card'
import { useHousehold } from '../../household-context'
import { CreditCardsDocument, LogPerkCreditDocument } from '../cards.queries'
import { PerkTracker } from '../perk-tracker'
import { LogCreditDialog } from '../log-credit-dialog'
import type { CreditCardsQuery } from '@/gql/graphql'

type Perk = CreditCardsQuery['creditCards'][number]['perks'][number]

export default function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { members } = useHousehold()
  const [error, setError] = useState<string | null>(null)
  const [logging, setLogging] = useState<Perk | null>(null)

  const [{ data, fetching }, refetch] = useQuery({ query: CreditCardsDocument })
  const [, logPerkCredit] = useMutation(LogPerkCreditDocument)

  function reload() {
    refetch({ requestPolicy: 'network-only' })
  }

  if (fetching && !data) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    )
  }

  const card = data?.creditCards.find((c) => c.id === id)

  if (!card) {
    return (
      <Stack gap={2} sx={{ maxWidth: 900, mx: 'auto' }}>
        <Button component={Link} href="/cards" startIcon={<ChevronLeftIcon />} sx={{ alignSelf: 'start', color: 'text.secondary' }}>
          Back to cards
        </Button>
        <Typography sx={{ color: 'text.secondary' }}>This card isn&rsquo;t in your wallet.</Typography>
      </Stack>
    )
  }

  const owner = members.find((m) => m.id === card.ownerId)
  const design = resolveCardDesign(card.design)
  const verdict = cardVerdict(card)
  const fee = cardAnnualFee(card)
  const ytd = cardCapturedYTD(card)
  const perksUsed = cardPerksUsed(card)
  const rewardCard = dbCardToRewardCard(card)
  const rewards = topRewards(rewardCard)
  const base = baseReward(rewardCard)

  return (
    <Stack gap={3} sx={{ maxWidth: 900, mx: 'auto' }}>
      <Button component={Link} href="/cards" startIcon={<ChevronLeftIcon />} sx={{ alignSelf: 'start', color: 'text.secondary' }}>
        Back to cards
      </Button>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <SurfaceCard>
        <Box sx={{ p: '24px 26px', bgcolor: design.color, color: design.text }}>
          <Row justify="between" align="start">
            <Box>
              <Typography sx={{ fontSize: 12, opacity: 0.75, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{card.issuer}</Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', mt: '4px' }}>{card.name}</Typography>
              <Typography sx={{ fontSize: 13, opacity: 0.8, mt: '6px' }}>
                {card.lastFour ? `•••• ${card.lastFour}` : 'No last four on file'}
                {card.openedDate ? ` · Opened ${new Date(card.openedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}
              </Typography>
            </Box>
            {owner && <MemberAvatar member={owner} size={36} />}
          </Row>
        </Box>
        <Row justify="between" align="center" sx={{ p: '18px 26px' }}>
          <Row gap={2.5}>
            <Stat label="Recovered YTD" value={fmtDollars(ytd)} />
            <Stat label="Annual fee" value={fee ? `${fmtDollars(fee)} / yr` : 'None'} />
            <Stat label="Perks used" value={`${perksUsed} / ${card.perks.length}`} />
          </Row>
          <StatusChip status={verdict.key} label={verdict.label} />
        </Row>
      </SurfaceCard>

      <PerkTracker cards={[card]} members={members} onLog={(perk) => setLogging(perk)} />

      <SurfaceCard>
        <PanelHeader icon="lightbulb" title="Reward multipliers" subtitle={`${owner ? memberLabel(owner) + "'s" : 'This'} card, every category`} />
        {rewards.length === 0 && !base ? (
          <Typography variant="body" sx={{ color: 'text.secondary', px: 2.25, py: 2.5 }}>
            No reward rates on file for this card.
          </Typography>
        ) : (
          <>
            {rewards.map((r, i) => (
              <Row key={r.cat} justify="between" sx={{ px: 2.25, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body">{r.note ? `${r.cat} — ${r.note}` : r.cat}</Typography>
                <Typography variant="bodyStrong" sx={tabularNums}>
                  {fmtRate(r)}
                </Typography>
              </Row>
            ))}
            {base && (
              <Row justify="between" sx={{ px: 2.25, py: 1.5 }}>
                <Typography variant="body" sx={{ color: 'text.secondary' }}>
                  Everything else
                </Typography>
                <Typography variant="bodyStrong" sx={tabularNums}>
                  {fmtRate(base)}
                </Typography>
              </Row>
            )}
          </>
        )}
      </SurfaceCard>

      <LogCreditDialog
        perk={logging}
        onClose={() => setLogging(null)}
        onSave={async (perkId, amount, date, description) => {
          const result = await logPerkCredit({ perkId, amount, date, description: description || undefined })
          if (result.error) setError(result.error.graphQLErrors[0]?.message ?? result.error.message)
          else setError(null)
          setLogging(null)
          reload()
        }}
      />
    </Stack>
  )
}
