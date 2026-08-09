'use client'

import { useState } from 'react'
import { useMutation, useQuery } from '@urql/next'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlineOutlined'
import { MemberAvatar } from '@/components/MemberAvatar'
import { MonthStepper, currentMonth } from '@/components/MonthStepper'
import { memberLabel } from '@/lib/members'
import { fmtMoney } from '@/lib/format'
import { useHousehold } from '../household-context'
import {
  BudgetMonthDocument,
  CreateBudgetDocument,
  DeleteBudgetDocument,
  UpdateBudgetDocument,
} from './budget.queries'

type BudgetRow = {
  id: string
  name: string
  ownerId: string
  amount: number
  spent: number
}

export default function BudgetPage() {
  const { me, members } = useHousehold()
  const [sel, setSel] = useState(currentMonth)
  const [error, setError] = useState<string | null>(null)

  const [{ data, fetching }, refetch] = useQuery({
    query: BudgetMonthDocument,
    variables: sel,
  })
  const [, createBudget] = useMutation(CreateBudgetDocument)
  const [, updateBudget] = useMutation(UpdateBudgetDocument)
  const [, deleteBudget] = useMutation(DeleteBudgetDocument)

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [ownerId, setOwnerId] = useState(me.id)

  const reload = () => refetch({ requestPolicy: 'network-only' })

  /** urql surfaces the resolver's message on graphQLErrors; keep the network one as a fallback. */
  function report(result: { error?: { graphQLErrors: readonly { message: string }[]; message: string } }) {
    if (!result.error) {
      setError(null)
      return true
    }
    setError(result.error.graphQLErrors[0]?.message ?? result.error.message)
    return false
  }

  async function handleCreate() {
    const value = Number(amount)
    if (!name.trim() || !Number.isFinite(value)) {
      setError('Enter a name and an amount')
      return
    }
    if (report(await createBudget({ name, amount: value, ownerId }))) {
      setName('')
      setAmount('')
      reload()
    }
  }

  async function handleAmount(row: BudgetRow, next: string) {
    const value = Number(next)
    if (!Number.isFinite(value) || value === row.amount) return
    if (report(await updateBudget({ id: row.id, amount: value }))) reload()
  }

  async function handleDelete(id: string) {
    if (report(await deleteBudget({ id }))) reload()
  }

  const budgets: BudgetRow[] = data?.budgetMonth ?? []

  return (
    <Stack spacing={3} sx={{ maxWidth: 720, mx: 'auto' }}>
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Budget
      </Typography>

      <MonthStepper value={sel} onChange={setSel} />

      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      {fetching && !data ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        // One card per member: budgets always belong to exactly one person, so
        // the owner is the natural grouping rather than a badge on each row.
        members.map((member) => {
          const owned = budgets.filter((b) => b.ownerId === member.id)
          const totalBudget = owned.reduce((sum, b) => sum + b.amount, 0)
          const totalSpent = owned.reduce((sum, b) => sum + b.spent, 0)

          return (
            <Card key={member.id} sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                  <MemberAvatar member={member} size={28} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
                    {memberLabel(member)}
                    {member.id === me.id && ' (you)'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {fmtMoney(totalSpent)} of {fmtMoney(totalBudget)}
                  </Typography>
                </Stack>

                {owned.length === 0 && (
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    No budgets yet.
                  </Typography>
                )}

                {owned.map((row) => {
                  const left = row.amount - row.spent
                  const over = left < 0
                  return (
                    <Stack key={row.id} spacing={0.5}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                          {row.name}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {fmtMoney(row.spent)} /
                        </Typography>
                        <TextField
                          size="small"
                          defaultValue={row.amount}
                          onBlur={(e) => handleAmount(row, e.target.value)}
                          slotProps={{ htmlInput: { inputMode: 'decimal', style: { width: 64 } } }}
                        />
                        <IconButton
                          size="small"
                          aria-label={`Delete ${row.name}`}
                          onClick={() => handleDelete(row.id)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        // The bar caps at 100% while the "left" figure below carries
                        // the overspend, so an outlier can't squash every other row.
                        value={row.amount > 0 ? Math.min(100, (row.spent / row.amount) * 100) : 0}
                        color={over ? 'error' : 'primary'}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: over ? 'error.main' : 'text.secondary' }}
                      >
                        {over ? `${fmtMoney(-left)} over` : `${fmtMoney(left)} left`}
                      </Typography>
                    </Stack>
                  )
                })}
              </Stack>
            </Card>
          )
        })
      )}

      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Add a budget
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              label="Name"
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ flex: 1 }}
            />
            <TextField
              label="Monthly"
              size="small"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              slotProps={{ htmlInput: { inputMode: 'decimal' } }}
              sx={{ width: 110 }}
            />
            <TextField
              label="Whose"
              size="small"
              select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              sx={{ width: 140 }}
            >
              {members.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {memberLabel(m)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          <Button variant="contained" onClick={handleCreate} sx={{ alignSelf: 'flex-start' }}>
            Add budget
          </Button>
        </Stack>
      </Card>
    </Stack>
  )
}
