'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import { MemberAvatar, type Member } from '@/components/MemberAvatar'
import { CatGlyph, Eyebrow, ListRow, PanelHeader, Row, Stack, SurfaceCard } from '@/components/ui'
import { fmtDollars } from '@/lib/format'
import { memberLabel } from '@/lib/members'
import { tabularNums, truncate } from '@/lib/sx'
import { CATEGORIES, dbCardToRewardCard, rankForCategory, resolveCardDesign } from '@/lib/cardRewards'
import type { CreditCardsQuery } from '@/gql/graphql'

type Card = CreditCardsQuery['creditCards'][number]

export function CardList({ cards, members }: { cards: Card[]; members: Member[] }) {
  const rewardCards = cards.map(dbCardToRewardCard)

  const bestForById = new Map<string, string[]>()
  for (const cat of CATEGORIES) {
    if (cat.key === 'base') continue
    for (const r of rankForCategory(rewardCards, cat.key)) {
      if (!r.winner) continue
      const list = bestForById.get(r.card.id) ?? []
      list.push(cat.label)
      bestForById.set(r.card.id, list)
    }
  }

  const owners = members.filter((m) => cards.some((c) => c.ownerId === m.id))
  const total = cards.reduce((sum, c) => sum + c.annualFee, 0)

  return (
    <SurfaceCard>
      <PanelHeader icon="creditCard" title="Cards & annual fees" subtitle="Each card owned by one person" />
      {owners.map((owner) => {
        const ownerCards = cards.filter((c) => c.ownerId === owner.id)
        const ownerTotal = ownerCards.reduce((sum, c) => sum + c.annualFee, 0)
        return (
          <Box key={owner.id}>
            <Row gap={1.25} sx={{ px: 2.25, py: 1.25, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
              <MemberAvatar member={owner} size={22} />
              <Eyebrow sx={{ flex: 1 }}>
                {memberLabel(owner)} <Box component="span" sx={{ color: 'text.disabled', fontWeight: 600 }}>{ownerCards.length}</Box>
              </Eyebrow>
              <Typography variant="bodyStrong" sx={tabularNums}>
                {fmtDollars(ownerTotal)}
              </Typography>
            </Row>
            {ownerCards.map((card, i) => {
              const design = resolveCardDesign(card.design)
              const bestFor = bestForById.get(card.id) ?? []
              return (
                <Link key={card.id} href={`/cards/${card.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                  <ListRow gap={1.5} last={i === ownerCards.length - 1} hover>
                    <Box sx={{ width: 30, height: 30, flexShrink: 0, borderRadius: '9px', bgcolor: design.color }} />
                    <Stack sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="bodyStrong" noWrap sx={truncate}>
                        {card.name}
                      </Typography>
                      <Typography variant="label" sx={{ color: 'text.secondary' }} noWrap>
                        {card.issuer}
                        {bestFor.length > 0 ? ` · best for ${bestFor.join(', ')}` : ''}
                      </Typography>
                    </Stack>
                    <Typography variant="bodyStrong" sx={{ flex: 'none', ...tabularNums }}>
                      {card.annualFee ? `${fmtDollars(card.annualFee)} / yr` : 'No annual fee'}
                    </Typography>
                  </ListRow>
                </Link>
              )
            })}
          </Box>
        )
      })}
      <Row justify="between" sx={{ px: 2.25, py: 1.5, bgcolor: 'grey.50' }}>
        <Eyebrow>{members.length > 1 ? 'Household total / yr' : 'Total / yr'}</Eyebrow>
        <Typography variant="bodyStrong" sx={tabularNums}>
          {fmtDollars(total)}
        </Typography>
      </Row>
    </SurfaceCard>
  )
}
