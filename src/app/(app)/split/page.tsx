'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@urql/next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Link from 'next/link'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import HandshakeIcon from '@mui/icons-material/HandshakeOutlined'
import { MonthStepper, currentMonth } from '@/components/MonthStepper'
import { MemberAvatar } from '@/components/MemberAvatar'
import { Eyebrow, ListRow, Row, Stack, SurfaceCard } from '@/components/ui'
import { fmtDay, fmtMoney } from '@/lib/format'
import { memberLabel } from '@/lib/members'
import { tabularNums } from '@/lib/sx'
import { brand } from '@/lib/theme'
import { useHousehold } from '../household-context'
import { CreateSettlementDocument, DeleteSettlementDocument, SplitPageDocument } from './split.queries'
import { SettleUpDialog } from './settle-up-dialog'

type MutationResult = { error?: { graphQLErrors: readonly { message: string }[]; message: string } }

export default function SplitPage() {
  const { me, partner, members } = useHousehold()
  const [sel, setSel] = useState(currentMonth)
  const [error, setError] = useState<string | null>(null)
  const [settleOpen, setSettleOpen] = useState(false)

  const [{ data, fetching }, refetch] = useQuery({
    query: SplitPageDocument,
    variables: sel,
    pause: partner == null,
  })
  const [, createSettlement] = useMutation(CreateSettlementDocument)
  const [, deleteSettlement] = useMutation(DeleteSettlementDocument)

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

  if (partner == null) {
    return (
      <Stack gap={2} sx={{ maxWidth: 640, mx: 'auto', py: 8, textAlign: 'center' }} align="center">
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Split
        </Typography>
        <Typography sx={{ color: 'text.secondary' }}>
          Pair up with someone to track who owes who.{' '}
          <Link href="/settings" style={{ color: brand.teal[700] }}>
            Invite a partner
          </Link>
          .
        </Typography>
      </Stack>
    )
  }

  const budgetStart =
    data?.household.budgetStartYear != null && data?.household.budgetStartMonth != null
      ? { year: data.household.budgetStartYear, month: data.household.budgetStartMonth }
      : null

  const outstanding = data?.splitPage.outstanding ?? { debtorUserId: null, creditorUserId: null, amount: 0 }
  const items = data?.splitPage.items ?? []
  const settlements = data?.splitPage.settlements ?? []
  const square = outstanding.amount === 0

  const debtor = members.find((m) => m.id === outstanding.debtorUserId) ?? me
  const creditor = members.find((m) => m.id === outstanding.creditorUserId) ?? partner

  function labelFor(userId: string): string {
    return userId === me.id ? 'you' : memberLabel(partner!)
  }

  return (
    <Stack gap={3} sx={{ maxWidth: 720, mx: 'auto' }}>
      <Stack direction="row" align="center" justify="between">
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Split
        </Typography>
        <MonthStepper value={sel} onChange={setSel} min={budgetStart} />
      </Stack>

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {fetching && !data ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <SurfaceCard>
            <Row justify="between" align="center" gap={2} sx={{ p: 3 }}>
              <Row gap={1.5} align="center">
                <MemberAvatar member={square ? me : debtor} size={40} />
                <Stack gap={0.25}>
                  <Eyebrow>Balance</Eyebrow>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {square
                      ? "You're square"
                      : `${debtor.id === me.id ? 'You' : memberLabel(debtor)} ${debtor.id === me.id ? 'owe' : 'owes'} ${creditor.id === me.id ? 'you' : memberLabel(creditor)} ${fmtMoney(outstanding.amount)}`}
                  </Typography>
                </Stack>
              </Row>
              {!square && (
                <Button variant="contained" startIcon={<HandshakeIcon />} onClick={() => setSettleOpen(true)}>
                  Settle up
                </Button>
              )}
            </Row>
          </SurfaceCard>

          <SurfaceCard>
            <Box sx={{ px: 2.5, pt: 2, pb: 0.5 }}>
              <Eyebrow>This month&rsquo;s shared costs</Eyebrow>
            </Box>
            {items.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', p: 3, pt: 1 }}>
                Nothing shared this month.
              </Typography>
            ) : (
              items.map((item, i) => (
                <ListRow key={item.transactionId} last={i === items.length - 1 && settlements.length === 0}>
                  <Stack sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                      {item.merchant}
                    </Typography>
                    <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
                      {fmtDay(item.date)} · Paid by {labelFor(item.payerUserId)}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ width: 96, textAlign: 'right', fontWeight: 600, ...tabularNums }}>
                    {fmtMoney(item.amount)}
                  </Typography>
                </ListRow>
              ))
            )}

            {settlements.length > 0 && (
              <>
                <Box sx={{ px: 2.5, pt: 2, pb: 0.5 }}>
                  <Eyebrow>Settlements</Eyebrow>
                </Box>
                {settlements.map((s, i) => (
                  <ListRow key={s.id} last={i === settlements.length - 1}>
                    <Stack sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                        {s.fromUserId === me.id ? 'You' : memberLabel(partner)} paid{' '}
                        {s.toUserId === me.id ? 'you' : memberLabel(partner)}
                      </Typography>
                      <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
                        {fmtDay(s.date)}
                        {s.note ? ` · ${s.note}` : ''}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ width: 96, textAlign: 'right', fontWeight: 600, ...tabularNums }}>
                      {fmtMoney(s.amount)}
                    </Typography>
                    <IconButton
                      size="small"
                      aria-label="Delete settlement"
                      onClick={async () => {
                        if (report(await deleteSettlement({ id: s.id }))) reload()
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </ListRow>
                ))}
              </>
            )}
          </SurfaceCard>
        </>
      )}

      <SettleUpDialog
        open={settleOpen}
        onClose={() => setSettleOpen(false)}
        debtor={debtor}
        creditor={creditor}
        amountOwed={outstanding.amount}
        onSubmit={async (input) => {
          const ok = report(await createSettlement(input))
          if (ok) reload()
          return ok
        }}
      />
    </Stack>
  )
}
