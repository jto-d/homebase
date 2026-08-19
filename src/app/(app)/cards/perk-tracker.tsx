'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/AddOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreOutlined'
import { MemberAvatar, type Member } from '@/components/MemberAvatar'
import { CatGlyph, Eyebrow, ListRow, PanelHeader, ProgressBar, Row, Stack, StatusChip, SurfaceCard } from '@/components/ui'
import { fmtDay, fmtMoney } from '@/lib/format'
import { memberLabel } from '@/lib/members'
import { tabularNums, truncate } from '@/lib/sx'
import {
  annualValue,
  capturedInCycle,
  capturedThisMonth,
  capturedYTD,
  nextResetDate,
  perkCoverage,
  perkStatus,
  periodLabel,
} from '@/lib/perk'
import type { CreditCardsQuery } from '@/gql/graphql'

type Card = CreditCardsQuery['creditCards'][number]
type Perk = Card['perks'][number]

interface PerkRow {
  card: Card
  perk: Perk
  owner: Member | undefined
}

const DAY_MS = 86_400_000

function daysUntil(reset: Date, now: Date): number {
  return Math.ceil((reset.getTime() - now.getTime()) / DAY_MS)
}

export function PerkTracker({
  cards,
  members,
  onLog,
}: {
  cards: Card[]
  members: Member[]
  onLog: (perk: Perk, card: Card) => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showCaptured, setShowCaptured] = useState(false)
  const [showOngoing, setShowOngoing] = useState(false)
  const now = new Date()

  const rows: PerkRow[] = cards.flatMap((card) =>
    card.perks.map((perk) => ({ card, perk, owner: members.find((m) => m.id === card.ownerId) }))
  )

  const active: PerkRow[] = []
  const captured: PerkRow[] = []
  const ongoing: PerkRow[] = []
  for (const row of rows) {
    const status = perkStatus(row.perk, row.card.openedDate, now).key
    if (status === 'captured') captured.push(row)
    else if (status === 'ongoing') ongoing.push(row)
    else active.push(row)
  }
  active.sort((a, b) => nextResetDate(a.perk, a.card.openedDate, now).getTime() - nextResetDate(b.perk, b.card.openedDate, now).getTime())

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <SurfaceCard>
      <PanelHeader icon="redeem" title="Perk & coupon tracker" subtitle="Recurring benefits, soonest to reset first" />

      {active.length === 0 ? (
        <Typography variant="body" sx={{ color: 'text.secondary', px: 2.25, py: 2.5 }}>
          All caught up. Nothing on the table.
        </Typography>
      ) : (
        active.map((row, i) => (
          <PerkTrackerRow
            key={row.perk.id}
            row={row}
            now={now}
            last={i === active.length - 1 && captured.length === 0 && ongoing.length === 0}
            expanded={expandedId === row.perk.id}
            onToggle={() => toggle(row.perk.id)}
            onLog={() => onLog(row.perk, row.card)}
          />
        ))
      )}

      {captured.length > 0 && (
        <Box>
          <GroupToggle label="Captured" count={captured.length} open={showCaptured} onToggle={() => setShowCaptured((v) => !v)} />
          <Collapse in={showCaptured}>
            {captured.map((row, i) => (
              <PerkTrackerRow
                key={row.perk.id}
                row={row}
                now={now}
                last={i === captured.length - 1 && ongoing.length === 0}
                expanded={expandedId === row.perk.id}
                onToggle={() => toggle(row.perk.id)}
                onLog={() => onLog(row.perk, row.card)}
              />
            ))}
          </Collapse>
        </Box>
      )}

      {ongoing.length > 0 && (
        <Box>
          <GroupToggle label="Lounge & travel" count={ongoing.length} open={showOngoing} onToggle={() => setShowOngoing((v) => !v)} />
          <Collapse in={showOngoing}>
            {ongoing.map((row, i) => (
              <PerkTrackerRow
                key={row.perk.id}
                row={row}
                now={now}
                last={i === ongoing.length - 1}
                expanded={expandedId === row.perk.id}
                onToggle={() => toggle(row.perk.id)}
                onLog={() => onLog(row.perk, row.card)}
              />
            ))}
          </Collapse>
        </Box>
      )}
    </SurfaceCard>
  )
}

function GroupToggle({ label, count, open, onToggle }: { label: string; count: number; open: boolean; onToggle: () => void }) {
  return (
    <Row
      gap={1}
      onClick={onToggle}
      sx={{ px: 2.25, py: 1.25, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', cursor: 'pointer', '&:hover': { bgcolor: 'grey.100' } }}
    >
      <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.secondary', transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 0.18s ease' }} />
      <Eyebrow sx={{ flex: 1 }}>
        {label} <Box component="span" sx={{ color: 'text.disabled', fontWeight: 600 }}>{count}</Box>
      </Eyebrow>
    </Row>
  )
}

function PerkTrackerRow({
  row,
  now,
  last,
  expanded,
  onToggle,
  onLog,
}: {
  row: PerkRow
  now: Date
  last: boolean
  expanded: boolean
  onToggle: () => void
  onLog: () => void
}) {
  const { card, perk, owner } = row
  const status = perkStatus(perk, card.openedDate, now)
  const cov = perkCoverage(perk, { basis: 'cycle', cardOpenedDate: card.openedDate, now })
  const reset = nextResetDate(perk, card.openedDate, now)
  const daysLeft = daysUntil(reset, now)
  const isMonthly = perk.period === 'MONTHLY'
  const isOpenEnded = cov.openEnded

  const thisMonth = isMonthly ? capturedThisMonth(perk, now) : 0
  const monthPct = isMonthly && perk.totalAmount > 0 ? Math.min(1, thisMonth / perk.totalAmount) : 0
  const ytd = capturedYTD(perk, now)
  const annual = annualValue(perk)

  return (
    <Box sx={{ borderBottom: last ? 'none' : '1px solid', borderColor: 'divider' }}>
      <ListRow gap={1.5} last onClick={onToggle} hover sx={{ cursor: 'pointer' }}>
        <IconButton size="small" sx={{ p: 0 }}>
          <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.disabled', transform: expanded ? 'none' : 'rotate(-90deg)', transition: 'transform 180ms ease' }} />
        </IconButton>
        {owner ? <MemberAvatar member={owner} size={32} /> : <CatGlyph icon="creditCard" size={32} />}
        <Stack sx={{ flex: 1, minWidth: 0 }}>
          <Row gap={1} wrap>
            <Typography variant="bodyStrong" noWrap sx={truncate}>
              {perk.name}
            </Typography>
            <StatusChip status={status.key} label={status.label} />
            {perk.enrollmentRequired && (
              <Typography variant="micro" sx={{ color: 'warning.main', bgcolor: 'warning.light', borderRadius: 999, px: 1, py: '2px' }}>
                Enrollment required
              </Typography>
            )}
          </Row>
          <Typography variant="label" sx={{ color: 'text.secondary', mt: '2px' }} noWrap>
            {isOpenEnded
              ? `${perk.perkCredits.length} visit${perk.perkCredits.length !== 1 ? 's' : ''} logged`
              : `${owner ? memberLabel(owner) : 'Joint'} · ${card.name} · ${periodLabel(perk.period)}`}
          </Typography>
        </Stack>
        <Box sx={{ textAlign: 'right', flex: 'none' }}>
          <Typography sx={{ fontSize: 16, fontWeight: 600, ...tabularNums }}>
            {isOpenEnded ? fmtMoney(ytd) : fmtMoney(cov.remaining)}
          </Typography>
          {!isOpenEnded && (status.key === 'expiring' || daysLeft <= 14) ? (
            <Typography
              variant="micro"
              sx={{
                display: 'inline-block',
                mt: '3px',
                px: 1,
                py: '2px',
                borderRadius: 999,
                fontWeight: 600,
                color: daysLeft <= 3 ? 'error.main' : 'warning.main',
                bgcolor: daysLeft <= 3 ? 'error.light' : 'warning.light',
              }}
            >
              {daysLeft <= 0 ? 'Resets today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
            </Typography>
          ) : (
            !isOpenEnded && (
              <Typography variant="micro" sx={{ color: 'text.disabled', mt: '3px', display: 'block' }}>
                Resets {fmtDay(reset.toISOString())}
              </Typography>
            )
          )}
        </Box>
        <Button size="small" startIcon={<AddIcon />} onClick={(e) => { e.stopPropagation(); onLog() }} sx={{ flex: 'none', color: 'text.secondary' }}>
          Log
        </Button>
      </ListRow>

      <Collapse in={expanded} unmountOnExit>
        <Box sx={{ px: '18px', pb: '16px', pl: '68px' }}>
          {!isOpenEnded && (
            <Box sx={{ mb: 1.5 }}>
              <ProgressBar value={cov.pct} />
              <Typography variant="note" sx={{ mt: '5px', color: 'text.secondary', ...tabularNums }}>
                {fmtMoney(capturedInCycle(perk, card.openedDate, now))} of {fmtMoney(perk.totalAmount)} this period
              </Typography>
              {isMonthly && (
                <>
                  <ProgressBar value={monthPct} color="grey.400" thin sx={{ mt: '8px' }} />
                  <Typography variant="micro" sx={{ mt: '3px', color: 'text.disabled', ...tabularNums }}>
                    {fmtMoney(ytd)} of {fmtMoney(annual)} / yr
                  </Typography>
                </>
              )}
            </Box>
          )}
          {perk.notes && (
            <Typography variant="note" sx={{ color: 'text.secondary', mb: 1.5 }}>
              {perk.notes}
            </Typography>
          )}
          {perk.perkCredits.length === 0 ? (
            <Typography variant="note" sx={{ color: 'text.disabled' }}>
              {isOpenEnded ? 'No visits logged yet.' : 'No credits logged this period.'}
            </Typography>
          ) : (
            <Stack sx={{ borderLeft: '1px solid', borderColor: 'divider' }}>
              {perk.perkCredits.map((c) => (
                <Row key={c.id} justify="between" sx={{ px: '14px', py: '6px' }}>
                  <Typography variant="note" sx={{ color: 'text.secondary' }}>
                    {fmtDay(c.date)}
                    {c.description && <Box component="span" sx={{ color: 'text.disabled', ml: '10px' }}>{c.description}</Box>}
                  </Typography>
                  <Typography variant="note" sx={{ fontWeight: 600, color: 'primary.main', ...tabularNums }}>
                    +{fmtMoney(c.amount)}
                  </Typography>
                </Row>
              ))}
            </Stack>
          )}
        </Box>
      </Collapse>
    </Box>
  )
}
