'use client'

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/AddOutlined'
import CloseIcon from '@mui/icons-material/CloseOutlined'
import { MemberAvatar, type Member } from '@/components/MemberAvatar'
import { EditableNumber, Eyebrow, SurfaceCard } from '@/components/ui'
import { memberLabel } from '@/lib/members'
import { KIND_LABEL } from './AddProgramDialog'
import type { PointsProgramsQuery } from '@/gql/graphql'

type Program = PointsProgramsQuery['pointsPrograms'][number]

function redeemedThisYear(program: Program, year: number): number {
  return program.redemptions.filter((r) => new Date(r.date).getUTCFullYear() === year).reduce((sum, r) => sum + r.points, 0)
}

interface ProgramGridProps {
  programs: Program[]
  members: Member[]
  year: number
  onEditBalance: (programId: string, balance: number) => void
  onRemove: (program: Program) => void
  onAddClick: () => void
}

export function ProgramGrid({ programs, members, year, onEditBalance, onRemove, onAddClick }: ProgramGridProps) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
      {programs.map((program) => {
        const owner = members.find((m) => m.id === program.ownerId)
        return (
          <SurfaceCard key={program.id} sx={{ position: 'relative', '&:hover .prog-remove': { opacity: 1 } }}>
            <IconButton
              className="prog-remove"
              onClick={() => onRemove(program)}
              aria-label={`Remove ${program.name}`}
              size="small"
              sx={{
                position: 'absolute',
                top: 6,
                right: 6,
                color: 'text.disabled',
                opacity: 0,
                '&:focus-visible': { opacity: 1 },
                '&:hover': { bgcolor: 'error.light', color: 'error.main' },
              }}
            >
              <CloseIcon sx={{ fontSize: 15 }} />
            </IconButton>

            <Box sx={{ p: '16px 16px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {owner && <MemberAvatar member={owner} size={22} />}
                <Eyebrow sx={{ fontSize: '11px' }}>
                  {owner ? memberLabel(owner) : 'Unknown'} · {KIND_LABEL[program.kind]}
                </Eyebrow>
              </Box>

              <Typography sx={{ fontSize: '14.5px', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.25 }}>{program.name}</Typography>

              <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px' }}>
                <EditableNumber value={program.balance} onChange={(v) => onEditBalance(program.id, v)} />
                <Typography sx={{ fontSize: '11.5px', color: 'text.secondary', mb: '3px' }}>
                  −{redeemedThisYear(program, year).toLocaleString('en-US')} in {year}
                </Typography>
              </Box>
            </Box>
          </SurfaceCard>
        )
      })}

      <Box
        component="button"
        onClick={onAddClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '7px',
          bgcolor: '#fff',
          border: '1px dashed',
          borderColor: 'grey.300',
          borderRadius: '13px',
          fontSize: '13px',
          fontWeight: 600,
          color: 'primary.main',
          cursor: 'pointer',
          fontFamily: 'inherit',
          minHeight: 118,
        }}
      >
        <AddIcon sx={{ fontSize: 18 }} />
        Add program
      </Box>
    </Box>
  )
}
