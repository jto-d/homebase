'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@urql/next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { Row, Stack, Stat, SurfaceCard } from '@/components/ui'
import { useHousehold } from '../household-context'
import {
  AddPointsProgramDocument,
  DeletePointsRedemptionDocument,
  LogPointsRedemptionDocument,
  PointsProgramsDocument,
  RemovePointsProgramDocument,
  UpdatePointsProgramBalanceDocument,
} from './points.queries'
import { AddProgramDialog } from './add-program-dialog'
import { ProgramGrid } from './program-grid'
import { RedemptionPanel } from './redemption-panel'
import { RemoveProgramDialog, type PendingRemove } from './remove-program-dialog'
import type { PointsProgramKind } from '@/gql/graphql'

type MutationResult = { error?: { graphQLErrors: readonly { message: string }[]; message: string } }

const CURRENT_YEAR = new Date().getUTCFullYear()

export default function PointsPage() {
  const { me, partner, members } = useHousehold()
  const [error, setError] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [pendingRemove, setPendingRemove] = useState<PendingRemove | null>(null)

  const [{ data, fetching }, refetch] = useQuery({ query: PointsProgramsDocument })
  const [, addProgram] = useMutation(AddPointsProgramDocument)
  const [, updateBalance] = useMutation(UpdatePointsProgramBalanceDocument)
  const [, removeProgram] = useMutation(RemovePointsProgramDocument)
  const [, logRedemption] = useMutation(LogPointsRedemptionDocument)
  const [, deleteRedemption] = useMutation(DeletePointsRedemptionDocument)

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

  const programs = data?.pointsPrograms ?? []
  const ytdPoints = programs.reduce(
    (sum, p) => sum + p.redemptions.filter((r) => new Date(r.date).getUTCFullYear() === CURRENT_YEAR).reduce((s, r) => s + r.points, 0),
    0
  )
  const ytdCount = programs.reduce((sum, p) => sum + p.redemptions.filter((r) => new Date(r.date).getUTCFullYear() === CURRENT_YEAR).length, 0)

  return (
    <Stack gap={3} sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Row justify="between" align="end" wrap gap={2}>
        <Box>
          <Typography variant="h5">Points</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: '3px' }}>
            Tap any balance to correct it by hand. Redemptions below subtract automatically.
          </Typography>
        </Box>
        <SurfaceCard sx={{ px: 2, py: 1.25 }}>
          <Stat align="right" label={`Redeemed in ${CURRENT_YEAR}`} value={`${ytdPoints.toLocaleString('en-US')} pts`} sub={`${ytdCount} ${ytdCount === 1 ? 'redemption' : 'redemptions'}`} />
        </SurfaceCard>
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
          <ProgramGrid
            programs={programs}
            members={members}
            year={CURRENT_YEAR}
            onAddClick={() => setAddOpen(true)}
            onRemove={(p) => setPendingRemove({ id: p.id, name: p.name })}
            onEditBalance={async (programId, balance) => {
              report(await updateBalance({ programId, balance }))
              reload()
            }}
          />

          <RedemptionPanel
            programs={programs}
            members={members}
            meId={me.id}
            showOwnerFilter={!!partner}
            onLog={async (programId, points, date, description, ownerId) => {
              const ok = report(await logRedemption({ programId, points, date, description, ownerId }))
              if (ok) reload()
            }}
            onDelete={async (redemptionId) => {
              const ok = report(await deleteRedemption({ redemptionId }))
              if (ok) reload()
            }}
          />
        </>
      )}

      <AddProgramDialog
        open={addOpen}
        members={members}
        meId={me.id}
        onClose={() => setAddOpen(false)}
        onAdd={async (name, kind: PointsProgramKind, ownerId, balance) => {
          const ok = report(await addProgram({ name, kind, ownerId, balance }))
          if (ok) {
            reload()
            setAddOpen(false)
          }
        }}
      />

      <RemoveProgramDialog
        program={pendingRemove}
        onClose={() => setPendingRemove(null)}
        onConfirm={async () => {
          if (!pendingRemove) return
          const ok = report(await removeProgram({ programId: pendingRemove.id }))
          setPendingRemove(null)
          if (ok) reload()
        }}
      />
    </Stack>
  )
}
