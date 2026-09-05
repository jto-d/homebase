'use client'

import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/AddOutlined'
import CloseIcon from '@mui/icons-material/CloseOutlined'
import { MemberAvatar, type Member } from '@/components/MemberAvatar'
import { ListRow, PanelHeader, Row, Segmented, Stack } from '@/components/ui'
import { fmtDay } from '@/lib/format'
import { memberLabel } from '@/lib/members'
import type { PointsProgramsQuery } from '@/gql/graphql'

type Program = PointsProgramsQuery['pointsPrograms'][number]

const HOUSEHOLD = 'household'

interface RedemptionPanelProps {
  programs: Program[]
  members: Member[]
  meId: string
  showOwnerFilter: boolean
  onLog: (programId: string, points: number, date: string, description: string, ownerId: string) => Promise<void> | void
  onDelete: (redemptionId: string) => void
}

export function RedemptionPanel({ programs, members, meId, showOwnerFilter, onLog, onDelete }: RedemptionPanelProps) {
  const [filter, setFilter] = useState<string>(HOUSEHOLD)
  const [composerOpen, setComposerOpen] = useState(false)
  const [programId, setProgramId] = useState<string>(programs[0]?.id ?? '')
  const [date, setDate] = useState('')
  const [desc, setDesc] = useState('')
  const [points, setPoints] = useState('')
  const [byId, setById] = useState(meId)
  const [submitting, setSubmitting] = useState(false)

  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])
  const programById = useMemo(() => new Map(programs.map((p) => [p.id, p])), [programs])

  const ledger = useMemo(() => {
    const rows = programs.flatMap((p) => p.redemptions.map((r) => ({ ...r, program: p })))
    const filtered = filter === HOUSEHOLD ? rows : rows.filter((r) => r.program.ownerId === filter)
    return filtered.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.id.localeCompare(a.id)))
  }, [programs, filter])

  function openComposer() {
    setProgramId(programs[0]?.id ?? '')
    setDate(new Date().toISOString().slice(0, 10))
    setDesc('')
    setPoints('')
    setById(meId)
    setComposerOpen(true)
  }

  const canSave = !!programId && desc.trim().length > 0 && !!date && parseInt(points, 10) > 0

  async function handleSave() {
    if (!canSave) return
    setSubmitting(true)
    try {
      await onLog(programId, parseInt(points, 10), date, desc.trim(), byId)
      setComposerOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box sx={{ bgcolor: '#fff', border: '1px solid', borderColor: 'divider', borderRadius: '14px', boxShadow: 1, overflow: 'hidden' }}>
      <PanelHeader
        icon="redeem"
        title="Redemptions"
        subtitle={`Newest first · ${ledger.length} shown`}
        action={
          <Row gap={1.25}>
            {showOwnerFilter && (
              <Segmented
                size="sm"
                value={filter}
                onChange={setFilter}
                options={[
                  { value: HOUSEHOLD, label: 'Household' },
                  ...members.map((m) => ({ value: m.id, label: memberLabel(m) })),
                ]}
              />
            )}
            {!composerOpen && (
              <Button variant="contained" size="small" startIcon={<AddIcon sx={{ fontSize: 17 }} />} onClick={openComposer}>
                Log redemption
              </Button>
            )}
          </Row>
        }
      />

      {composerOpen && (
        <Stack gap={1.5} sx={{ p: '14px 22px', bgcolor: 'primary.50', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Row gap={1} wrap>
            {programs.map((p) => {
              const owner = memberById.get(p.ownerId)
              const on = programId === p.id
              return (
                <Box
                  key={p.id}
                  component="button"
                  onClick={() => setProgramId(p.id)}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    height: 30,
                    px: '11px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    border: '1px solid',
                    borderColor: on ? 'primary.main' : 'divider',
                    bgcolor: on ? 'primary.main' : '#fff',
                    color: on ? '#fff' : 'text.primary',
                  }}
                >
                  {owner && <MemberAvatar member={owner} size={16} />}
                  {p.name}
                </Box>
              )
            })}
          </Row>

          <Row gap={1.25} align="end" wrap>
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              size="small"
              sx={{ width: 150 }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="What you booked"
              value={desc}
              placeholder="Hyatt Ziva, 3 nights"
              onChange={(e) => setDesc(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 180 }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Points"
              value={points}
              placeholder="60000"
              onChange={(e) => setPoints(e.target.value.replace(/\D/g, ''))}
              size="small"
              sx={{ width: 120 }}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { inputMode: 'numeric' } }}
            />
            <Box>
              <Typography sx={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'primary.main', mb: '5px' }}>
                Redeemed by
              </Typography>
              <Segmented size="sm" value={byId} onChange={setById} options={members.map((m) => ({ value: m.id, label: memberLabel(m) }))} />
            </Box>
            <Button variant="contained" size="small" disabled={!canSave || submitting} onClick={handleSave}>
              Save
            </Button>
            <Button variant="subtle" size="small" onClick={() => setComposerOpen(false)}>
              Cancel
            </Button>
          </Row>
        </Stack>
      )}

      <Row sx={{ px: '18px', py: '9px', bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography sx={{ width: 58, flex: 'none', fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.disabled' }}>
          Date
        </Typography>
        <Typography sx={{ flex: 1, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.disabled' }}>
          Redemption
        </Typography>
        <Typography sx={{ width: 200, flex: 'none', fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.disabled' }}>
          Program
        </Typography>
        <Typography sx={{ width: 92, flex: 'none', textAlign: 'right', fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'text.disabled' }}>
          Points
        </Typography>
        <Box sx={{ width: 26, flex: 'none' }} />
      </Row>

      {ledger.length === 0 ? (
        <Box sx={{ py: '34px', textAlign: 'center', fontSize: 13, color: 'text.disabled' }}>Nothing logged for this filter yet.</Box>
      ) : (
        ledger.map((r, i) => {
          const owner = memberById.get(r.program.ownerId)
          const by = r.ownerId ? memberById.get(r.ownerId) : null
          return (
            <ListRow key={r.id} last={i === ledger.length - 1} sx={{ gap: '14px', px: '18px' }}>
              <Typography sx={{ width: 58, flex: 'none', fontSize: 12, fontWeight: 600, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
                {fmtDay(r.date)}
              </Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.005em', lineHeight: 1.3 }}>{r.description}</Typography>
                {by && (
                  <Typography sx={{ fontSize: '11.5px', color: 'text.secondary', mt: '2px' }}>Redeemed by {memberLabel(by)}</Typography>
                )}
              </Box>
              <Row sx={{ width: 200, flex: 'none' }} gap={1}>
                {owner && <MemberAvatar member={owner} size={22} />}
                <Typography sx={{ fontSize: '12.5px', color: 'text.secondary', minWidth: 0 }} noWrap>
                  {r.program.name}
                </Typography>
              </Row>
              <Typography sx={{ width: 92, flex: 'none', textAlign: 'right', fontSize: '14.5px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                −{r.points.toLocaleString('en-US')}
              </Typography>
              <IconButton
                onClick={() => onDelete(r.id)}
                aria-label="Delete redemption"
                size="small"
                sx={{ width: 26, height: 26, flex: 'none', color: 'text.disabled', '&:hover': { bgcolor: 'error.light', color: 'error.main' } }}
              >
                <CloseIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </ListRow>
          )
        })
      )}
    </Box>
  )
}
