'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Collapse from '@mui/material/Collapse'
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreOutlined'
import { MemberAvatar, type Member } from '@/components/MemberAvatar'
import { CatGlyph, Eyebrow, ListRow, PanelHeader, Row, Stack, SurfaceCard } from '@/components/ui'
import { tabularNums } from '@/lib/sx'
import { memberLabel } from '@/lib/members'
import { CATEGORIES, dbCardToRewardCard, fmtRate, rankForCategory, type RewardCardData } from '@/lib/cardRewards'
import type { CreditCardsQuery } from '@/gql/graphql'

type Card = CreditCardsQuery['creditCards'][number]

export function CategoryGuide({ cards, members }: { cards: Card[]; members: Member[] }) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const rewardCards = cards.map(dbCardToRewardCard)
  const ownerOf = new Map(cards.map((c) => [c.id, members.find((m) => m.id === c.ownerId)]))
  const categories = CATEGORIES.filter((c) => c.key !== 'base')

  return (
    <SurfaceCard>
      <PanelHeader
        icon="lightbulb"
        title="Best card by category"
        subtitle={members.length > 1 ? "The winner across both wallets — use whoever's card it is" : 'The winner in your wallet'}
      />
      {categories.map((cat, i) => {
        const ranked = rankForCategory(rewardCards, cat.key)
        const winners = ranked.filter((r) => r.winner)
        const open = openKey === cat.key
        const last = i === categories.length - 1 && !open

        if (winners.length === 0) return null

        const uniqueOwners = Array.from(new Set(winners.map((w) => ownerOf.get(w.card.id)?.id))).map((id) => members.find((m) => m.id === id))
        const tie = winners.length > 1 && uniqueOwners.filter(Boolean).length > 1

        return (
          <Box key={cat.key}>
            <ListRow gap={1.5} last={last} hover onClick={() => setOpenKey(open ? null : cat.key)} sx={{ cursor: 'pointer' }}>
              <CatGlyph icon={cat.icon} tone="accent" />
              <Stack sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="bodyStrong">{cat.label}</Typography>
                <Typography variant="label" sx={{ color: 'text.secondary' }}>
                  {fmtRate(winners[0].reward)}
                  {winners[0].viaBase ? ' · base rate' : ''}
                </Typography>
              </Stack>
              {tie ? (
                <Row sx={{ flex: 'none' }}>
                  <Row sx={{ '& > *:not(:first-of-type)': { ml: '-8px' } }}>
                    {uniqueOwners.filter(Boolean).map((o) => (
                      <MemberAvatar key={o!.id} member={o!} size={26} />
                    ))}
                  </Row>
                  <Typography variant="body" sx={{ ml: 1 }}>
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      Either wallet
                    </Box>{' '}
                    — both {fmtRate(winners[0].reward)}
                  </Typography>
                </Row>
              ) : (
                <Row gap={1} sx={{ flex: 'none' }}>
                  {uniqueOwners[0] && <MemberAvatar member={uniqueOwners[0]} size={26} />}
                  <Typography variant="body">
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      {uniqueOwners[0] ? `${memberLabel(uniqueOwners[0])}'s` : "Joint"}
                    </Box>{' '}
                    {winners[0].card.name}
                  </Typography>
                </Row>
              )}
              <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.disabled', transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 0.18s ease' }} />
            </ListRow>
            <Collapse in={open}>
              <Box sx={{ bgcolor: 'grey.50', borderBottom: last ? 'none' : '1px solid', borderColor: 'divider' }}>
                {ranked.map((r, idx) => {
                  const owner = ownerOf.get(r.card.id)
                  return (
                    <Row key={r.card.id} justify="between" gap={1.5} sx={{ px: '18px', py: '9px', pl: '58px', borderTop: idx === 0 ? 'none' : '1px solid', borderColor: 'divider' }}>
                      <Row gap={1} sx={{ minWidth: 0 }}>
                        <Typography variant="note" sx={{ color: 'text.disabled', width: 16 }}>
                          {idx + 1}
                        </Typography>
                        {owner && <MemberAvatar member={owner} size={20} />}
                        <Typography variant="body" noWrap>
                          {r.card.name}
                        </Typography>
                        {r.viaBase && (
                          <Typography variant="micro" sx={{ color: 'text.disabled' }}>
                            base rate
                          </Typography>
                        )}
                      </Row>
                      <Typography variant="bodyStrong" sx={{ color: r.winner ? 'primary.main' : 'text.secondary', ...tabularNums }}>
                        {fmtRate(r.reward)}
                      </Typography>
                    </Row>
                  )
                })}
              </Box>
            </Collapse>
          </Box>
        )
      })}
    </SurfaceCard>
  )
}
